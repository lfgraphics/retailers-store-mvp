import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Retailer from '@/models/Retailer';
import { requireCustomer } from '@/middleware/auth';
import { createRazorpayOrder } from '@/lib/razorpay';
import { ERROR_MESSAGES } from '@/lib/constants';

// POST create payment order
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = requireCustomer(request);

    const { orderId } = await request.json();

    // Check if online payment is enabled
    const retailer = await Retailer.findOne();
    if (!retailer?.onlinePaymentEnabled) {
      return NextResponse.json(
        { error: 'Online payment is currently disabled' },
        { status: 400 }
      );
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.ORDER_NOT_FOUND },
        { status: 404 }
      );
    }

    // Verify order belongs to customer
    if (order.customerId.toString() !== user.userId) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 403 }
      );
    }

    // Verify payment method is online
    if (order.paymentMethod !== 'ONLINE') {
      return NextResponse.json(
        { error: 'Order payment method is not online' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder(
      order.finalAmount,
      order._id.toString()
    );

    // Update order with Razorpay order ID
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: order.finalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Create payment error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (error.message.includes('Razorpay')) {
      return NextResponse.json(
        { error: 'Payment service unavailable' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
