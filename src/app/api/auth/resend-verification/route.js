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
  console.log("--- Resend Verification Request Received ---");
  try {
    await connectDB();
    console.log("Database connected successfully.");

    const { email } = await request.json();
    console.log("Resend request for email:", email);

    if (!email) {
      // console.log("Resend failed: Email is required.");
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });
    console.log("User found for resend:", user ? user.toObject() : null);

    if (!user) {
      console.log("User not found, sending success-like response.");
      return NextResponse.json({ success: true });
    }

    if (user.isEmailVerified) {
      console.log("Resend failed: Email is already verified.");
      return NextResponse.json(
        { success: false, error: "Email is already verified" },
        { status: 400 }
      );
    }

    console.log("Generating new verification token...");
    const verificationToken = await generateVerificationToken(user);
    const verificationUrl = `${
      process.env.NEXT_PUBLIC_APP_URL
    }/verify-email?token=${encodeURIComponent(verificationToken)}`;
    const emailTemplate = getVerificationEmailTemplate(
      user.username,
      verificationUrl
    );

    console.log("Attempting to send verification email...");
    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });
    console.log("Verification email sent successfully.");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("!!! Unhandled error in resend-verification:", error);
    // Special handling for email errors to not expose details
    if (error.message === "Error sending email") {
      return handleApiError(new Error("Could not send verification email."));
    }
    return handleApiError(error);
  }
}
