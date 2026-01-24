import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Category from '@/models/Category';
import { ERROR_MESSAGES } from '@/lib/constants';

// GET active categories for public shop
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true }).sort({ name: 1 });

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Get public categories error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
