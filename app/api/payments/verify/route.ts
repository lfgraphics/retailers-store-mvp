import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireCustomer } from '@/middleware/auth';
import { ERROR_MESSAGES, PAYMENT_STATUS } from '@/lib/constants';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = requireCustomer(request);

    const { 
      orderId, 
      razorpayPaymentId, 
      razorpayOrderId, 
      razorpaySignature 
    } = await request.json();

    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing payment details' },
        { status: 400 }
      );
    }

    // Verify signature
    const text = razorpayOrderId + "|" + razorpayPaymentId;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest("hex");

    if (generated_signature !== razorpaySignature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Update order status
    const order = await Order.findOneAndUpdate(
      { _id: orderId, customerId: user.userId },
      { 
        paymentStatus: PAYMENT_STATUS.PAID,
        razorpayPaymentId: razorpayPaymentId
      },
      { new: true }
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Payment verified successfully',
      order
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
