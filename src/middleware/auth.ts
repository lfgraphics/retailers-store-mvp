import { NextRequest } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, TokenPayload } from '@/lib/auth';
import { ERROR_MESSAGES } from '@/lib/constants';

export interface AuthRequest extends NextRequest {
  user?: TokenPayload;
}

/**
 * Extract and verify JWT token from request
 */
export function getAuthUser(request: NextRequest): TokenPayload | null {
  try {
    // Try to get token from Authorization header
    const authHeader = request.headers.get('authorization');
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      // console.log('Auth Debug: Bearer token found in header');
    }

    // If no Authorization header, try cookies
    if (!token) {
      token = request.cookies.get('accessToken')?.value || null;
      if (token) console.log('Auth Debug: Token found in cookie');
    }

    if (!token) {
      // console.log('Auth Debug: No token found. Headers:', JSON.stringify(Object.fromEntries(request.headers.entries())));
      return null;
    }

    const payload = verifyAccessToken(token);
    // console.log('Auth Debug: Verification success for user:', payload.userId);
    return payload;
  } catch (error: any) {
    console.error('Auth middleware: Access token verification failed:', error.message);

    // Fallback: Check for valid Refresh Token in cookies
    // This allows seamless experience if access token expired but refresh token is valid
    const refreshToken = request.cookies.get('refreshToken')?.value;
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        console.log('Auth middleware: Valid refresh token found, allowing access via fallback.');
        return payload;
      } catch (refreshError) {
        console.error('Auth middleware: Refresh token verification also failed');
      }
    }

    return null;
  }
}

/**
 * Require authentication - returns user or throws error
 */
export function requireAuth(request: NextRequest): TokenPayload {
  const user = getAuthUser(request);

  if (!user) {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }

  return user;
}

/**
 * Require retailer role
 */
export function requireRetailer(request: NextRequest): TokenPayload {
  const user = requireAuth(request);

  if (user.role !== 'retailer') {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }

  return user;
}

/**
 * Require customer role
 */
export function requireCustomer(request: NextRequest): TokenPayload {
  const user = requireAuth(request);

  if (user.role !== 'customer') {
    throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
  }

  return user;
}
