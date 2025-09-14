import { NextResponse } from 'next/server';
import User from '../../../../models/User';
import crypto from 'crypto';
import { sendEmail } from '../../../../lib/email';

// Request password reset
export async function POST(request) {
  try {
    const { email } = await request.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'If an account exists with this email, a password reset link will be sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpiry = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // Send email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        text: `You requested a password reset. Click here to reset your password: ${resetUrl}`
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset link sent to email'
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      return NextResponse.json({
        success: false,
        error: 'Error sending reset email'
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error processing password reset request'
    }, { status: 500 });
  }
}