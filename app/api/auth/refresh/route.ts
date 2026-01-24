import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { ERROR_MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
    try {
        // Get refresh token from cookies or body
        let refreshToken = request.cookies.get('refreshToken')?.value;

        if (!refreshToken) {
            const body = await request.json();
            refreshToken = body.refreshToken;
        }

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'Refresh token not provided' },
                { status: 401 }
            );
        }

        // Verify refresh token
        const payload = verifyRefreshToken(refreshToken);

        // Generate new tokens
        const newAccessToken = generateAccessToken(payload);
        const newRefreshToken = generateRefreshToken(payload);

        // Create response
        const response = NextResponse.json({
            message: 'Tokens refreshed successfully',
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });

        // Set new cookies
        response.cookies.set('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 15,
        });

        response.cookies.set('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
            { error: ERROR_MESSAGES.TOKEN_EXPIRED },
            { status: 401 }
        );
    }
}
