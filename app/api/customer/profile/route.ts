import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { requireCustomer } from '@/middleware/auth';
import { ERROR_MESSAGES } from '@/lib/constants';

// GET customer profile
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = requireCustomer(request);

    const customer = await Customer.findById(user.userId).select('-password');

    if (!customer) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error('Get customer profile error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

// PUT update customer profile
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const user = requireCustomer(request);

    const body = await request.json();
    
    // We only allow updating deliveryAddress for now in this route
    // but can be expanded later
    const updatedCustomer = await Customer.findByIdAndUpdate(
      user.userId,
      { $set: body },
      { new: true }
    ).select('-password');

    if (!updatedCustomer) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      customer: updatedCustomer 
    });
  } catch (error: any) {
    console.error('Update customer profile error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
