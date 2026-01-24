import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import Review from '@/models/Review';
import { ERROR_MESSAGES } from '@/lib/constants';

// GET single product with reviews (Public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const product = await Product.findById(id);

    if (!product || (!product.isActive)) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.PRODUCT_NOT_FOUND },
        { status: 404 }
      );
    }

    // Get reviews with customer info
    const reviews = await Review.find({ productId: id })
      .populate('customerId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      product: {
        ...product.toObject(),
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length,
      },
      reviews,
    });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
