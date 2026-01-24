import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Retailer from '@/models/Retailer';
import { requireRetailer } from '@/middleware/auth';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';

// GET public retailer settings (no auth required)
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get the first/only retailer's settings
    const retailer = await Retailer.findOne().select('onlinePaymentEnabled');

    if (!retailer) {
      return NextResponse.json({
        onlinePaymentEnabled: false,
      });
    }

    return NextResponse.json({
      onlinePaymentEnabled: retailer.onlinePaymentEnabled || false,
    });
  } catch (error: any) {
    console.error('Get retailer settings error:', error);
    return NextResponse.json(
      { onlinePaymentEnabled: false },
      { status: 200 }
    );
  }
}


// PATCH update settings (online payment toggle)
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const user = requireRetailer(request);

    const { onlinePaymentEnabled } = await request.json();

    if (typeof onlinePaymentEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'onlinePaymentEnabled must be a boolean' },
        { status: 400 }
      );
    }

    const retailer = await Retailer.findByIdAndUpdate(
      user.userId,
      { onlinePaymentEnabled },
      { new: true }
    ).select('-password');

    if (!retailer) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      onlinePaymentEnabled: retailer.onlinePaymentEnabled,
    });
  } catch (error: any) {
    console.error('Update settings error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
