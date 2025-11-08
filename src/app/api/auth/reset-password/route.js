import { NextResponse } from 'next/server';
import User from '../../../../models/User';
import { verifyToken } from '../../../../lib/jwt';
import { handleApiError } from '../../../../middleware/auth';
import connectDB from '../../../../lib/mongoose';

export async function POST(request) {
  try {
    await connectDB();
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
  }

  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ success: false, error: 'Token and password are required' }, { status: 400 });
    }

    const decoded = await verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    user.password = password;
    await user.save();

    return NextResponse.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    return handleApiError(error);
  }
}