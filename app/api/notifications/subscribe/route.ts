import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Retailer from '@/models/Retailer';
import { getAuthUser } from '@/middleware/auth';
import { ERROR_MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        const user = getAuthUser(request);

        if (!user) {
            return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: 401 });
        }

        const subscription = await request.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json(
                { error: 'Invalid subscription object' },
                { status: 400 }
            );
        }

        if (user.role === 'customer') {
            const customer = await Customer.findById(user.userId);
            if (!customer) {
                return NextResponse.json({ error: ERROR_MESSAGES.USER_NOT_FOUND }, { status: 404 });
            }

            const exists = customer.pushSubscriptions.some((sub: any) => sub.endpoint === subscription.endpoint);
            if (!exists) {
                customer.pushSubscriptions.push(subscription);
                await customer.save();
            }
        } else if (user.role === 'retailer') {
            const retailer = await Retailer.findById(user.userId);
            if (!retailer) {
                return NextResponse.json({ error: ERROR_MESSAGES.USER_NOT_FOUND }, { status: 404 });
            }

            const exists = retailer.pushSubscriptions.some((sub: any) => sub.endpoint === subscription.endpoint);
            if (!exists) {
                retailer.pushSubscriptions.push(subscription);
                await retailer.save();
            }
        }

        return NextResponse.json({ message: 'Subscribed successfully' });
    } catch (error: any) {
        console.error('Push subscription error:', error);
        return NextResponse.json(
            { error: ERROR_MESSAGES.SERVER_ERROR },
            { status: 500 }
        );
    }
}
