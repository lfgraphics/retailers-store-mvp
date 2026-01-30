import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import '@/models/Customer'; // Ensure Customer model is registered
import Order from '@/models/Order';
import { requireCustomer } from '@/middleware/auth';
import { reviewSchema } from '@/lib/validation';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, ORDER_STATUS } from '@/lib/constants';

// GET reviews for a product
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const reviews = await Review.find({ productId })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

// POST submit review (only for delivered orders)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = requireCustomer(request);

    const body = await request.json();

    // Validate request
    const validation = reviewSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { productId, orderId, rating, comment } = validation.data;

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

    // Verify order is delivered
    if (order.status !== ORDER_STATUS.DELIVERED) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.REVIEW_NOT_ALLOWED },
        { status: 400 }
      );
    }

    // Verify product is in order
    const productInOrder = order.items.some(
      (item: any) => item.productId.toString() === productId
    );

    if (!productInOrder) {
      return NextResponse.json(
        { error: 'Product not found in this order' },
        { status: 400 }
      );
    }

    // Check if review already exists
    const existingReview = await Review.findOne({
      customerId: user.userId,
      productId,
      orderId,
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product for this order' },
        { status: 400 }
      );
    }

    // Create review
    const review = new Review({
      customerId: user.userId,
      productId,
      orderId,
      rating,
      comment,
    });

    await review.save();

    return NextResponse.json({
      message: SUCCESS_MESSAGES.REVIEW_SUBMITTED,
      review,
    });
  } catch (error: any) {
    console.error('Submit review error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
