import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Coupon from '@/models/Coupon';
import { requireCustomer } from '@/middleware/auth';
import { orderCreationSchema } from '@/lib/validation';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, PAYMENT_STATUS } from '@/lib/constants';
import { calculateDiscount } from '@/lib/utils';
import { notifyRetailer } from '@/lib/notification-service';
import Retailer from '@/models/Retailer';
import Razorpay from 'razorpay';

// GET customer orders
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const user = requireCustomer(request);

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        const orders = await Order.find({ customerId: user.userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return NextResponse.json({ orders });
    } catch (error: unknown) {
        console.error('Get orders error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage === ERROR_MESSAGES.UNAUTHORIZED) {
            return NextResponse.json({ error: errorMessage }, { status: 401 });
        }

        return NextResponse.json(
            { error: ERROR_MESSAGES.SERVER_ERROR },
            { status: 500 }
        );
    }
}

// POST create order
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const user = requireCustomer(request);

        const body = await request.json();

        // Validate request
        const validation = orderCreationSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { items, deliveryAddress, paymentMethod, couponCode, couponCodes: inputCouponCodes } = validation.data;

        // Normalize coupon codes
        let codesToApply: string[] = [];
        if (inputCouponCodes && inputCouponCodes.length > 0) {
            codesToApply = inputCouponCodes;
        } else if (couponCode) {
            codesToApply = [couponCode];
        }
        // Remove duplicates and normalize
        codesToApply = [...new Set(codesToApply.map(c => c.toUpperCase()))];

        // Validate stock and get product details
        const orderItems = await Promise.all(
            items.map(async (item: { productId: string; quantity: number }) => {
                const product = await Product.findById(item.productId);

                if (!product || !product.isActive) {
                    throw new Error(`Product ${item.productId} not found`);
                }

                if (product.stock < item.quantity) {
                    throw new Error(
                        `Insufficient stock for ${product.name}. Available: ${product.stock}`
                    );
                }

                return {
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity,
                };
            })
        );

        // Calculate item total
        const totalAmount = orderItems.reduce(
            (sum: number, item) => sum + item.price * item.quantity,
            0
        );

        // Get Store Settings (for delivery charge)
        const retailerSettings = await Retailer.findOne().select('defaultDeliveryCharge pushSubscriptions');
        let deliveryCharge = retailerSettings?.defaultDeliveryCharge || 0;

        let discountAmount = 0;
        const appliedCoupons: any[] = [];

        // Apply coupons if provided
        if (codesToApply.length > 0) {
            if (codesToApply.length > 2) {
                return NextResponse.json(
                    { error: 'Maximum 2 coupons allowed per order' },
                    { status: 400 }
                );
            }

            const coupons = await Coupon.find({
                code: { $in: codesToApply },
                isActive: true,
            });

            if (coupons.length !== codesToApply.length) {
                return NextResponse.json(
                    { error: 'One or more coupons are invalid' },
                    { status: 400 }
                );
            }

            // Check coupon combination rules
            const freeDeliveryCoupons = coupons.filter((c: any) => c.discountType === 'FREE_DELIVERY');
            const discountCoupons = coupons.filter((c: any) => c.discountType !== 'FREE_DELIVERY');

            if (freeDeliveryCoupons.length > 1) {
                return NextResponse.json(
                    { error: 'Only one free delivery coupon allowed' },
                    { status: 400 }
                );
            }

            if (discountCoupons.length > 1) {
                return NextResponse.json(
                    { error: 'Only one discount coupon allowed' },
                    { status: 400 }
                );
            }

            // Validate and Apply
            const now = new Date();
            for (const coupon of coupons) {
                if (now < coupon.validFrom || now > coupon.validTo) {
                    return NextResponse.json(
                        { error: `Coupon ${coupon.code} has expired` },
                        { status: 400 }
                    );
                }

                if (totalAmount < coupon.minOrderAmount) {
                    return NextResponse.json(
                        { error: `Coupon ${coupon.code} requires minimum order of ₹${coupon.minOrderAmount}` },
                        { status: 400 }
                    );
                }

                if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                    return NextResponse.json(
                        { error: `Coupon ${coupon.code} usage limit reached` },
                        { status: 400 }
                    );
                }

                if (coupon.discountType === 'FREE_DELIVERY') {
                    deliveryCharge = 0;
                } else {
                    discountAmount += calculateDiscount(
                        totalAmount,
                        coupon.discountType,
                        coupon.discountValue,
                        coupon.maxDiscountAmount
                    );
                }

                appliedCoupons.push(coupon);
            }
        }

        // Final Calculation
        // Ensure discount doesn't exceed total
        if (discountAmount > totalAmount) {
            discountAmount = totalAmount;
        }
        
        const finalAmount = totalAmount + deliveryCharge - discountAmount;

        // Create order
        const order = new Order({
            customerId: user.userId,
            items: orderItems,
            totalAmount,
            discountAmount,
            deliveryCharge,
            finalAmount,
            couponCodes: codesToApply,
            deliveryAddress,
            paymentMethod,
            paymentStatus: PAYMENT_STATUS.PENDING,
            status: 'ORDERED',
        });

        // Increment usage count for coupons
        for (const coupon of appliedCoupons) {
            coupon.usedCount += 1;
            await coupon.save();
        }

        // If online payment, create Razorpay order
        if (paymentMethod === 'ONLINE') {
            const instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID || '',
                key_secret: process.env.RAZORPAY_KEY_SECRET,
            });

            const options = {
                amount: Math.round(finalAmount * 100), // amount in the smallest currency unit (paise)
                currency: 'INR',
                receipt: order._id.toString(),
            };

            const razorpayOrder = await instance.orders.create(options);
            order.razorpayOrderId = razorpayOrder.id;
        }

        await order.save();

        // Notify retailers about the new order
        try {
            await notifyRetailer({
                title: 'New Order Received! 📦',
                body: `Order #${order._id.toString().slice(-6)} placed by ${user.name || 'a customer'}`,
                url: `/retailer/orders/${order._id}`,
                icon: '/icons/icon-192x192.png',
            });
        } catch (error) {
            // Log once for total push process failure
            console.error('Retailer notification process failed', error);
        }

        // Reduce stock
        await Promise.all(
            items.map(async (item: { productId: string; quantity: number }) => {
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { stock: -item.quantity },
                });
            })
        );

        return NextResponse.json({
            message: SUCCESS_MESSAGES.ORDER_PLACED,
            order,
        });
    } catch (error: unknown) {
        console.error('Create order error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        if (errorMessage === ERROR_MESSAGES.UNAUTHORIZED) {
            return NextResponse.json({ error: errorMessage }, { status: 401 });
        }

        if (errorMessage.includes('Insufficient stock') || errorMessage.includes('not found')) {
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

        return NextResponse.json(
            { error: ERROR_MESSAGES.SERVER_ERROR },
            { status: 500 }
        );
    }
}
