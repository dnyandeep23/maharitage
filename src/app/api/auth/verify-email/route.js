import { NextResponse } from 'next/server';
import User from '@/models/User';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { token } = await request.json();

    // Hash token
    const verificationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      verificationToken,
      verificationTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired verification token'
      }, { status: 400 });
    }

    // Update user
    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error verifying email'
    }, { status: 500 });
  }
}