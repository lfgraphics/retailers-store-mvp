import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import '@/models/Customer'; // Ensure Customer model is registered
import { requireRetailer } from '@/middleware/auth';
import { ERROR_MESSAGES, SUCCESS_MESSAGES, ORDER_STATUSES } from '@/lib/constants';
import { z } from 'zod';

// GET single order (Retailer)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = requireRetailer(request);

    const order = await Order.findById(id)
      .populate('customerId', 'name phone email');

    if (!order) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.ORDER_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Get order error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

// PUT update order status (Retailer)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    await connectDB();
    const user = requireRetailer(request);

    const body = await request.json();

    // Validate status using ORDER_STATUSES from constants
    const statusValues = ORDER_STATUSES.map(s => s.value) as [string, ...string[]];
    const validation = z.object({
      status: z.enum(statusValues),
    }).safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { status } = validation.data;

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.ORDER_NOT_FOUND },
        { status: 404 }
      );
    }

    // Update status and add to history
    order.status = status;
    order.statusHistory.push({
      status,
      updatedAt: new Date(),
    });

    await order.save();

    return NextResponse.json({
      message: SUCCESS_MESSAGES.ORDER_UPDATED,
      order,
    });
  } catch (error: any) {
    console.error('Update order status error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
