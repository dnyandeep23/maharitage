import { NextResponse } from 'next/server';
import User from '@/models/User';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { token, password } = await request.json();

    // Hash token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired reset token'
      }, { status: 400 });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error resetting password'
    }, { status: 500 });
  }
}