import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Retailer from '@/models/Retailer';
import { getAuthUser, requireRetailer } from '@/middleware/auth';
import { storeProfileSchema } from '@/lib/validation';
import { ERROR_MESSAGES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// GET retailer profile
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = getAuthUser(request);

    let retailer;
    if (user?.role === 'retailer') {
      // Full profile for the retailer (Admin user viewing store profile)
      retailer = await Retailer.findOne();
    } else {
      // Public profile for customers and visitors
      retailer = await Retailer.findOne().select(
        'storeName storeDescription storeAddress contactPhone contactEmail logo bannerImages banners onlinePaymentEnabled defaultDeliveryCharge'
      );
    }

    if (!retailer) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ profile: retailer });
  } catch (error: unknown) {
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
      console.error('Validation error:', validation.error);
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    console.log('Updating retailer profile for:', user.userId);
    console.log('Banners update:', validation.data.banners ? `Yes (${validation.data.banners.length} items)` : 'No');

    const retailer = await Retailer.findOneAndUpdate(
      {}, // Update the singleton store profile
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
  } catch (error: unknown) {
    console.error('Update retailer profile error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (errorMessage === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: errorMessage }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
