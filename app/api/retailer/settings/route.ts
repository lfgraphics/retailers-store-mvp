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
    const retailer = await Retailer.findOne().select('onlinePaymentEnabled defaultDeliveryCharge');

    if (!retailer) {
      return NextResponse.json({
        onlinePaymentEnabled: false,
        defaultDeliveryCharge: 0,
      });
    }

    return NextResponse.json({
      onlinePaymentEnabled: retailer.onlinePaymentEnabled || false,
      defaultDeliveryCharge: retailer.defaultDeliveryCharge || 0,
    });
  } catch (error: any) {
    console.error('Get retailer settings error:', error);
    return NextResponse.json(
      { onlinePaymentEnabled: false, defaultDeliveryCharge: 0 },
      { status: 200 }
    );
  }
}


// PATCH update settings
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();
    const user = requireRetailer(request);

    const body = await request.json();
    const updates: any = {};

    if (typeof body.onlinePaymentEnabled === 'boolean') {
      updates.onlinePaymentEnabled = body.onlinePaymentEnabled;
    }

    if (typeof body.defaultDeliveryCharge === 'number') {
        if (body.defaultDeliveryCharge < 0) {
            return NextResponse.json(
                { error: 'Delivery charge cannot be negative' },
                { status: 400 }
            );
        }
        updates.defaultDeliveryCharge = body.defaultDeliveryCharge;
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json(
            { error: 'No valid fields to update' },
            { status: 400 }
        );
    }

    // Update the singleton Store Profile
    const retailer = await Retailer.findOneAndUpdate(
      {}, // Match any (first) document
      updates,
      { new: true }
    ).select('-password');

    if (!retailer) {
      return NextResponse.json(
        { error: 'Store profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Settings updated successfully',
      onlinePaymentEnabled: retailer.onlinePaymentEnabled,
      defaultDeliveryCharge: retailer.defaultDeliveryCharge,
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
