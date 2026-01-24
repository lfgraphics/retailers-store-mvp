import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import { requireRetailer } from '@/middleware/auth';
import { ERROR_MESSAGES } from '@/lib/constants';

// GET all categories for retailer
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    requireRetailer(request);

    const categories = await Category.find().sort({ name: 1 });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Get categories error:', error);
    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

// POST create a new category
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    requireRetailer(request);

    const { name, description, image, isActive } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const existingCategory = await Category.findOne({ name: name.trim() });
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      );
    }

    const category = await Category.create({
      name: name.trim(),
      description: description?.trim(),
      image,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: any) {
    console.error('Create category error:', error);
    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
