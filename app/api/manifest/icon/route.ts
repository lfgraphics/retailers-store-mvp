import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import connectDB from '@/lib/mongodb';
import Retailer from '@/models/Retailer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const size = parseInt(searchParams.get('size') || '192');
    
    // Connect to DB and fetch retailer logo
    await connectDB();
    const retailer = await Retailer.findOne().select('logo');
    
    if (!retailer || !retailer.logo) {
      // Return 404 or default icon if possible. 
      // For now 404, fallback handled in manifest.ts logic if needed? 
      // Actually manifest.ts points here. 
      return new NextResponse('Logo not found', { status: 404 });
    }

    // Fetch the image from the URL
    const response = await fetch(retailer.logo);
    if (!response.ok) {
      return new NextResponse('Failed to fetch logo', { status: 500 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Resize using sharp
    const resizedBuffer = await sharp(buffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .toFormat('png')
      .toBuffer();

    return new NextResponse(resizedBuffer as any, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });

  } catch (error) {
    console.error('Icon generation error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
