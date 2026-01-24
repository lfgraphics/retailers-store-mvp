import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Customer from '@/models/Customer';
import { customerRegistrationSchema } from '@/lib/validation';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validate request body
    const validation = customerRegistrationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, phone, deliveryAddress } = validation.data;

    // Check if customer already exists by phone
    const existingCustomer = await Customer.findOne({ phone });
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Phone number already registered' },
        { status: 400 }
      );
    }

    // Create new customer
    const customer = new Customer({
      name,
      email,
      password,
      phone,
      deliveryAddress,
    });

    await customer.save();

    // Generate tokens
    const tokenPayload = {
      userId: customer._id.toString(),
      role: 'customer' as const,
      email: customer.email,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Create response
    const response = NextResponse.json({
      message: SUCCESS_MESSAGES.REGISTRATION_SUCCESS,
      user: {
        id: customer._id,
        name: customer.name,
        email: customer.email,
      },
      accessToken,
      refreshToken,
    });

    // Set HTTP-only cookies
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
  } catch (error) {
    console.error('Customer registration error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
