import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';
import { requireRetailer } from '@/middleware/auth';
import { couponSchema } from '@/lib/validation';

// GET all coupons
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = requireRetailer(request);

    const coupons = await Coupon.find().sort({ createdAt: -1 });

    return NextResponse.json({ coupons });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new coupon
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = requireRetailer(request);
    const body = await request.json();

    const validation = couponSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { code } = validation.data;
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 400 }
      );
    }

    const coupon = new Coupon({
      ...validation.data,
      code: code.toUpperCase(),
    });

    await coupon.save();

    return NextResponse.json({ 
      message: 'Coupon created successfully',
      coupon 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
