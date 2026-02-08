import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requireRetailer } from '@/middleware/auth';
import { comparePassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { passwordChangeSchema } from '@/lib/validation';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify authentication
    const user = requireRetailer(request);

    const body = await request.json();

    // Validate request body
    const validation = passwordChangeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Find admin user
    const admin = await Admin.findById(user.userId);
    if (!admin) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.USER_NOT_FOUND },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    // Generate new tokens
    const tokenPayload = {
      userId: admin._id.toString(),
      role: 'retailer' as const, // Keeping 'retailer' role for compatibility
      name: admin.name || admin.username,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Create response
    const response = NextResponse.json({
      message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
      accessToken,
      refreshToken,
    });

    // Set new cookies
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15,
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Password change error:', error);

    if (error.message === ERROR_MESSAGES.UNAUTHORIZED) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
