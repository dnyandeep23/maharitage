
import { NextResponse } from 'next/server';
import User from '../../../../models/User.js';
import { verifyToken } from '../../../../lib/jwt.js';
import connectDB from '../../../../lib/mongoose.js';
import { handleApiError } from '../../../middleware/auth.js';

export async function POST(request) {

  console.log('--- Verify Email Request Received ---');
  try {
    await connectDB();
    console.log('Database connected successfully.');
    const { token } = await request.json();
    // console.log('Request body:', token);
    console.log('Verification token received:', token);

    if (!token) {
      console.log('Verify failed: Token is required.');
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    var decoded;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 });
    }
    console.log('Decoded token payload:', decoded);

    if (!decoded) {
      console.log('Verify failed: Invalid or expired token.');
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 });
    }

    const user = await User.findOne({ email: decoded.email });
    // console.log('User found for verification:', user ? user.toObject() : null);

    if (!user) {
      console.log('Verify failed: User not found.');
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    if (user.isEmailVerified) {
      console.log('Email is already verified.');
      return NextResponse.json({ success: true, message: 'Email already verified' });
    }

    console.log('Updating user to verified...');
    user.isEmailVerified = true;
    await user.save();
    console.log('User updated successfully.');

    return NextResponse.json({ success: true, message: 'Email verified successfully' });

  } catch (error) {
    console.error('!!! Unhandled error in verify-email:', error);
    return handleApiError(error);
  }
}
