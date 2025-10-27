import { NextResponse } from "next/server";
import User from "../../../../models/User.js";
import { handleApiError } from "../../../../middleware/auth.js";
import {
  generateToken,
  generateVerificationToken,
} from "../../../../lib/jwt.js";
import connectDB from "../../../../lib/mongoose.js";
import {
  sendEmail,
  getVerificationEmailTemplate,
} from "../../../../lib/email.js";

export async function POST(request) {
  try {
    // Connect to database
    await connectDB();
  } catch (error) {
    console.error("Database connection failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        message: "Could not connect to the database. Please try again later.",
      },
      { status: 500 }
    );
  }
  try {
    const temp = await request.json();
    const { username, email, password, role } = temp;
    console.log("Processing registration request...");

    // Validate input
    if (!username || !email || !password || !role) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please provide all required fields (username, email, password, role)",
        },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["public-user", "research-expert", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: `Invalid role "${role}". Must be one of: ${validRoles.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Check if user already exists
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
          error: "User already exists",
          message:
            existingUser.email === email.toLowerCase()
              ? "An account with this email already exists"
              : "This username is already taken",
        },
        { status: 409 }
      );
    }

    // Create user with sanitized data
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role,
      isEmailVerified: false, // Ensure new users start unverified
      lastLogin: new Date(),
    });

    // Generate verification token
    const verificationToken = await generateVerificationToken(user);
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;

    // Send verification email
    const emailTemplate = getVerificationEmailTemplate(
      user.username,
      verificationUrl
    );
    await sendEmail({
      to: user.email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    // Create token using our utility function
    const token = generateToken(user);

    // Remove password from response
    const userResponse = { ...user.toObject(), password: undefined };

    return NextResponse.json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
