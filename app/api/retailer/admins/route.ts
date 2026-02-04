import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Admin from '@/models/Admin';
import { requireRetailer } from '@/middleware/auth';
import { hashPassword } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = requireRetailer(request);

    // Only allow fetching admins if the user is authorized (all admins can see list?)
    // Let's allow all admins to see the list for now
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });

    return NextResponse.json({ admins });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = requireRetailer(request);

    // Check if current user is super_admin
    const currentUser = await Admin.findById(user.userId);
    if (!currentUser || currentUser.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized: Only Super Admin can create admins' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, name, role } = body;

    if (!username || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const newAdmin = new Admin({
      username,
      password, // Pre-save hook will hash it
      name,
      role: role || 'admin',
    });

    await newAdmin.save();

    return NextResponse.json({ message: 'Admin created successfully', admin: { ...newAdmin.toObject(), password: undefined } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
