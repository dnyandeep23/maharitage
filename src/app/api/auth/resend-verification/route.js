import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose.js";
import User from "../../../../models/User.js";
import { generateVerificationToken } from "../../../../lib/jwt.js";
import {
  sendEmail,
  getVerificationEmailTemplate,
} from "../../../../lib/email.js";
import { handleApiError } from "../../../../middleware/auth.js";

export async function POST(request) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ success: true });
    }

    if (user.isEmailVerified) {
      return NextResponse.json(
        { success: false, error: "Email is already verified" },
        { status: 400 }
      );
    }

    const verificationToken = await generateVerificationToken(user);
    const verificationUrl = `${
      process.env.NEXT_PUBLIC_APP_URL
    }/verify-email?token=${encodeURIComponent(verificationToken)}`;
    const emailTemplate = getVerificationEmailTemplate(
      user.username,
      verificationUrl
    );

    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Special handling for email errors to not expose details
    if (error.message === "Error sending email") {
      return handleApiError(new Error("Could not send verification email."));
    }
    return handleApiError(error);
  }
}
