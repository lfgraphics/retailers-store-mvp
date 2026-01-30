import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { seedDatabase } from '@/lib/seed-service';
import { ERROR_MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const result = await seedDatabase();
    
    if (result.alreadySeeded) {
      return NextResponse.json(
        { message: result.message },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { message: result.message },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Seeding endpoint error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR, details: error.message },
      { status: 500 }
    );
  }
}

// Also allow GET for convenience, though POST is more standard for state changes
export async function GET(request: NextRequest) {
  return POST(request);
}
