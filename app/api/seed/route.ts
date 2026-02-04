import { NextRequest, NextResponse } from 'next/server';
import { seedDatabase } from '@/lib/seed-service';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Basic security check - in production you might want a secret key
    // For now, allowing it as requested for development utility
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    await connectDB();
    
    // If force=true, we might want to reset the seeding flag (use with caution)
    // But seedDatabase service already handles idempotency nicely.
    
    const result = await seedDatabase();
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
