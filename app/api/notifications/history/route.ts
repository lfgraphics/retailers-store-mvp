import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { requireAuth } from '@/middleware/auth';
import { ERROR_MESSAGES } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    requireAuth(request);

    // Fetch all public notifications
    const notifications = await Notification.find({
      targetAudience: 'ALL',
    })
      .sort({ sentAt: -1 })
      .limit(20);

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
