import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Retailer from '@/models/Retailer';
import { getAuthUser, requireRetailer } from '@/middleware/auth';
import { storeProfileSchema } from '@/lib/validation';
import { ERROR_MESSAGES } from '@/lib/constants';

// GET retailer profile
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(request);

    let retailer;
    if (user?.role === 'retailer') {
      // Full profile for the retailer
      retailer = await Retailer.findById(user.userId).select('-password');
    } else {
      // Public profile for customers and visitors
      retailer = await Retailer.findOne().select(
        'storeName storeDescription storeAddress contactPhone contactEmail logo bannerImages onlinePaymentEnabled'
      );
    }

    if (!retailer) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: retailer });
  } catch (error: any) {
    console.error('Get retailer profile error:', error);

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

// PUT update retailer profile
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const user = requireRetailer(request);

    const body = await request.json();

    // Validate request
    const validation = storeProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const retailer = await Retailer.findByIdAndUpdate(
      user.userId,
      validation.data,
      { new: true }
    ).select('-password');

    if (!retailer) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: retailer,
    });
  } catch (error: any) {
    console.error('Update retailer profile error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
