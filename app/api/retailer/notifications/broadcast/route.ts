import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Notification from '@/models/Notification';
import { requireRetailer } from '@/middleware/auth';
import { ERROR_MESSAGES } from '@/lib/constants';
import webpush from 'web-push';

// Configuration for web-push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(
        'mailto:support@localstore.com',
        vapidPublicKey,
        vapidPrivateKey
    );
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        requireRetailer(request);

        const { title, message, url, image } = await request.json();

        if (!title || !message) {
            return NextResponse.json(
                { error: 'Title and message are required' },
                { status: 400 }
            );
        }

        // Save notification to database
        const notification = await Notification.create({
            title,
            message,
            image,
            targetAudience: 'ALL',
            sentAt: new Date(),
        });

        // Fetch all customers with push subscriptions
        const customers = await Customer.find({
            'pushSubscriptions.0': { $exists: true },
        }).select('pushSubscriptions');

        const payload = JSON.stringify({
            title,
            body: message,
            url: url || '/',
            icon: '/icons/icon-192x192.png',
        });

        const sendPromises = customers.flatMap((customer) =>
            customer.pushSubscriptions.map((subscription: any) =>
                webpush.sendNotification(subscription, payload).catch((error: any) => {
                    console.error('Error sending push notification:', error);
                    // If subscription is invalid/expired, we could remove it here
                    return null;
                })
            )
        );

        // We don't wait for all sends to complete before responding
        // to keep the API responsive, but we trigger them
        Promise.all(sendPromises);

        return NextResponse.json({
            message: 'Broadcast sent successfully',
            notification,
        });
    } catch (error: any) {
        console.error('Broadcast error:', error);
        if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }
        return NextResponse.json(
            { error: ERROR_MESSAGES.SERVER_ERROR },
            { status: 500 }
        );
    }
}
