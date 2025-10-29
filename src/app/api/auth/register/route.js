import { NextResponse } from "next/server";
import User from "../../../../models/User.js";
import { handleApiError } from "../../../../middleware/auth.js";
import { generateVerificationToken } from "../../../../lib/jwt.js";
import connectDB from "../../../../lib/mongoose.js";
import {
  sendEmail,
  getVerificationEmailTemplate,
} from "../../../../lib/email.js";
import disposableDomains from "disposable-email-domains";

export async function POST(request) {
  try {
    await connectDB();
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Database connection failed" },
      { status: 500 }
    );
  }

  try {
    const { username, email, password, role } = await request.json();

    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }

    // 🔹 Block temporary / disposable emails
    const domain = email.split("@")[1].toLowerCase();
    if (disposableDomains.includes(domain)) {
      return NextResponse.json(
        {
          success: false,
          error: "Temporary emails are not allowed.",
          message:
            "Please use a valid email provider. Temporary or disposable emails are not supported.",
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["public-user", "research-expert", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role." },
        { status: 400 }
      );
    }

    // Existing user check
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User already exists.",
          message:
            existingUser.email === email.toLowerCase()
              ? "An account with this email already exists."
              : "This username is already taken.",
        },
        { status: 409 }
      );
    }

    // Create user
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role,
      isEmailVerified: false,
      lastLogin: new Date(),
    });

    // Generate and send verification link
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

    return NextResponse.json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
