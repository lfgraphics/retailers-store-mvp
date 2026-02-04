import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { requireCustomer } from '@/middleware/auth';
import { ERROR_MESSAGES } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const customer = requireCustomer(request);

    // Get excluded IDs from query params
    const { searchParams } = new URL(request.url);
    const excludeIds = searchParams.get('exclude')?.split(',').filter(Boolean) || [];

    const query: any = {
      $or: [
        { targetAudience: 'ALL' },
        {
          targetAudience: 'SPECIFIC',
          targetCustomerIds: customer.userId
        }
      ]
    };

    if (excludeIds.length > 0) {
      query._id = { $nin: excludeIds };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
