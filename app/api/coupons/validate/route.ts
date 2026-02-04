import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Coupon from '@/models/Coupon';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true,
        });

        if (!coupon) {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
        }

        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validTo) {
            return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
        }

        return NextResponse.json({ coupon });
    } catch (error) {
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}
