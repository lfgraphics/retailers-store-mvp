import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import { requireCustomer } from '@/middleware/auth';
import { verifyRazorpaySignature } from '@/lib/razorpay';
import { ERROR_MESSAGES, PAYMENT_STATUS } from '@/lib/constants';

// POST verify payment
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = requireCustomer(request);

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      await request.json();

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

    // Verify signature
    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      // Mark payment as failed
      order.paymentStatus = PAYMENT_STATUS.FAILED;
      await order.save();

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Update order with payment details
    order.razorpayPaymentId = razorpayPaymentId;
    order.paymentStatus = PAYMENT_STATUS.PAID;
    await order.save();

    return NextResponse.json({
      message: 'Payment verified successfully',
      order,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
