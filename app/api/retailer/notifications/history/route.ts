import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { requireRetailer } from '@/middleware/auth';
import { ERROR_MESSAGES } from '@/lib/constants';

// GET retailer notification history
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    requireRetailer(request);

    // Fetch notifications sent by this retailer (or all notifications if we don't track sentBy yet)
    // For this simple project, we'll fetch all notifications marked for ALL or specific targets
    const notifications = await Notification.find()
      .sort({ sentAt: -1 })
      .limit(50);

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Retailer notification history error:', error);
    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
