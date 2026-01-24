import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Order from '@/models/Order';
import Product from '@/models/Product';
import Customer from '@/models/Customer';
import { requireRetailer } from '@/middleware/auth';
import { ERROR_MESSAGES } from '@/lib/constants';

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        const user = requireRetailer(request);

        // Get all stats in parallel
        const [
            totalProducts,
            pendingOrders,
            totalCustomers,
            revenueData
        ] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            Order.countDocuments({
                status: { $in: ['ORDERED', 'CONFIRMED', 'PROCESSING'] }
            }),
            Customer.countDocuments(),
            Order.aggregate([
                { $match: { status: 'DELIVERED' } },
                { $group: { _id: null, total: { $sum: '$finalAmount' } } }
            ])
        ]);

        return NextResponse.json({
            stats: {
                products: totalProducts,
                pendingOrders,
                totalCustomers,
                revenue: revenueData.length > 0 ? revenueData[0].total : 0,
            }
        });
    } catch (error: any) {
        console.error('Get stats error:', error);

        if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        return NextResponse.json(
            { error: ERROR_MESSAGES.SERVER_ERROR },
            { status: 500 }
        );
    }
}
