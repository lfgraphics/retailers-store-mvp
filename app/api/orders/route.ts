import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import Coupon from '@/models/Coupon';
import { requireCustomer } from '@/middleware/auth';
import { orderCreationSchema } from '@/lib/validation';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, PAYMENT_STATUS } from '@/lib/constants';
import { calculateDiscount } from '@/lib/utils';
import webpush from 'web-push';
import Retailer from '@/models/Retailer';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:support@localstore.com',
        vapidPublicKey,
        vapidPrivateKey
    );
}

// GET customer orders
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const user = requireCustomer(request);

        const orders = await Order.find({ customerId: user.userId })
            .sort({ createdAt: -1 })
            .limit(50);

        return NextResponse.json({ orders });
    } catch (error: any) {
        console.error('Get orders error:', error);

        if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
            return NextResponse.json({ error: error.message }, { status: 401 });
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

        const { items, deliveryAddress, paymentMethod, couponCode } = validation.data;

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

        // Calculate totals
        const totalAmount = orderItems.reduce(
            (sum: number, item) => sum + item.price * item.quantity,
            0
        );

        let discountAmount = 0;

        // Apply coupon if provided
        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode.toUpperCase(),
                isActive: true,
            });

            if (!coupon) {
                return NextResponse.json(
                    { error: ERROR_MESSAGES.INVALID_COUPON },
                    { status: 400 }
                );
            }

            // Validate coupon
            const now = new Date();
            if (now < coupon.validFrom || now > coupon.validTo) {
                return NextResponse.json(
                    { error: 'Coupon has expired' },
                    { status: 400 }
                );
            }

            if (totalAmount < coupon.minOrderAmount) {
                return NextResponse.json(
                    {
                        error: `Minimum order amount ₹${coupon.minOrderAmount} required for this coupon`,
                    },
                    { status: 400 }
                );
            }

            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                return NextResponse.json(
                    { error: 'Coupon usage limit reached' },
                    { status: 400 }
                );
            }

            discountAmount = calculateDiscount(
                totalAmount,
                coupon.discountType,
                coupon.discountValue,
                coupon.maxDiscountAmount
            );

            // Increment usage count
            coupon.usedCount += 1;
            await coupon.save();
        }

        const finalAmount = totalAmount - discountAmount;

        // Create order
        const order = new Order({
            customerId: user.userId,
            items: orderItems,
            totalAmount,
            discountAmount,
            finalAmount,
            couponCode: couponCode?.toUpperCase(),
            deliveryAddress,
            paymentMethod,
            paymentStatus: PAYMENT_STATUS.PENDING,
            status: 'ORDERED',
        });

        // If online payment, create Razorpay order
        if (paymentMethod === 'ONLINE') {
            const Razorpay = require('razorpay');
            const instance = new Razorpay({
                key_id: process.env.RAZORPAY_KEY_ID,
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

        // Notify retailers about the new order via push
        try {
            const retailers = await Retailer.find({
                'pushSubscriptions.0': { $exists: true },
            }).select('pushSubscriptions');

            const payload = JSON.stringify({
                title: 'New Order Received! 📦',
                body: `Order #${order._id.toString().slice(-6)} placed by ${user.name || 'a customer'}`,
                url: `/retailer/orders/${order._id}`,
                icon: '/icons/icon-192x192.png',
            });

            retailers.forEach((retailer: any) => {
                retailer.pushSubscriptions.forEach((sub: any) => {
                    webpush.sendNotification(sub, payload).catch(() => {
                        // Silent fail for individual push delivery in production
                    });
                });
            });
        } catch (pushErr) {
            // Log once for total push process failure
            console.error('Retailer notification process failed');
        }

        // Reduce stock (Note: For online, maybe should wait for payment? 
        // But for simplicity in this project, we'll reduce now and increment if failed)
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
    } catch (error: any) {
        console.error('Create order error:', error);

        if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        if (error.message.includes('Insufficient stock') || error.message.includes('not found')) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(
            { error: ERROR_MESSAGES.SERVER_ERROR },
            { status: 500 }
        );
    }
}
