import { NextResponse } from 'next/server';
import User from '../../../../models/User';
import { generatePasswordResetToken } from '../../../../lib/jwt';
import { sendEmail, getPasswordResetEmailTemplate } from '../../../../lib/email';
import { handleApiError } from '../../../../middleware/auth';
import connectDB from '../../../../lib/mongoose';

// Request password reset
export async function POST(request) {
  try {
    await connectDB();
  } catch (err) {
    console.error('DB connection error', err);
    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // To prevent user enumeration, we send a success-like response even if the user doesn't exist.
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link will be sent.'
      });
    }

    const resetToken = await generatePasswordResetToken(user);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    try {
      const emailTemplate = getPasswordResetEmailTemplate(user.username, resetUrl);
      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset link sent to email'
      });
    } catch (error) {
      console.error('Error sending reset email:', error);
      return handleApiError(new Error('Could not send password reset email.'));
    }
  } catch (error) {
    return handleApiError(error);
  }
}