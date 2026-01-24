import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Retailer from '@/models/Retailer';
import { comparePassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { retailerLoginSchema } from '@/lib/validation';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate request body
    const validation = retailerLoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { username, password } = validation.data;

    // Find retailer
    const retailer = await Retailer.findOne({ username });
    if (!retailer) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, retailer.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    // Generate tokens
    const tokenPayload = {
      userId: retailer._id.toString(),
      role: 'retailer' as const,
      name: retailer.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Create response
    const response = NextResponse.json({
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      isFirstLogin: retailer.isFirstLogin,
      user: {
        id: retailer._id,
        username: retailer.username,
        storeName: retailer.storeName,
      },
      accessToken,
      refreshToken,
    });

    // Set HTTP-only cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 minutes
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Retailer login error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
