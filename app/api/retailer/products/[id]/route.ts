import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';
import { requireRetailer } from '@/middleware/auth';
import { productSchema } from '@/lib/validation';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';

// GET single product (Retailer)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = requireRetailer(request);

    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.PRODUCT_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Get product error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

// PUT update product (Retailer)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = requireRetailer(request);

    const body = await request.json();

    // Validate request body
    const validation = productSchema.partial().safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndUpdate(
      id,
      validation.data,
      { new: true }
    );

    if (!product) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.PRODUCT_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: SUCCESS_MESSAGES.PRODUCT_UPDATED,
      product,
    });
  } catch (error: any) {
    console.error('Update product error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

// DELETE product (soft delete - Retailer)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = requireRetailer(request);

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.PRODUCT_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: SUCCESS_MESSAGES.PRODUCT_DELETED,
    });
  } catch (error: any) {
    console.error('Delete product error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
