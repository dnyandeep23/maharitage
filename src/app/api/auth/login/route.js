// app/api/auth/login/route.js
import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose.js";
import User from "../../../../models/User.js";
import {
  generateToken,
  generateVerificationToken,
} from "../../../../lib/jwt.js";
import { handleApiError } from "../../../../middleware/auth.js";
import {
  sendEmail,
  getVerificationEmailTemplate,
} from "../../../../lib/email.js";

export async function POST(request) {
  try {
    await connectDB();
  } catch (err) {
    console.error("DB connection error", err);
    return NextResponse.json(
      { success: false, error: "Database connection failed" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    // console.log('Login request body:', body);

    const { email, password, role } = body;

    // Validate required fields
    if (!email || !password || !role) {
      const missingFields = [];
      if (!email) missingFields.push("email");
      if (!password) missingFields.push("password");
      if (!role) missingFields.push("role");

      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: "Please provide all required fields",
          fields: missingFields,
        },
        { status: 400 }
      );
    }

    // Select password and role
    const user = await User.findOne({ email }).select("+password +role");
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication error",
          message: "Invalid email or password",
          fields: ["email", "password"],
        },
        { status: 401 }
      );
    }

    // Validate role match
    if (role !== user.role) {
      return NextResponse.json(
        {
          success: false,
          error: "Role mismatch",
          message: `Access denied. Your account doesn't have ${role} privileges.`,
          fields: ["role"],
        },
        { status: 403 }
      );
    }

    if (!user.isEmailVerified) {
      // Resend verification email
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

      const resultPayload = {
        success: false,
        errorCode: "EMAIL_NOT_VERIFIED",
        error: "EMAIL_NOT_VERIFIED",
        message:
          "Please verify your email. A new verification email has been sent.",
      };

      console.log("🚀 Sending response:", resultPayload);

      return NextResponse.json(resultPayload, { status: 403 });
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          error: "Account error",
          message: "Your account is not active. Please contact support.",
        },
        { status: 403 }
      );
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication error",
          message: "Invalid password",
          fields: ["password"],
        },
        { status: 401 }
      );
    }

    // Build response user without password
    var userObj = user.toObject();
    userObj = (({
      password,
      lastlogin,
      createdAt,
      updatedAt,
      __v,
      status,
      ...rest
    }) => rest)(userObj);

    const token = await generateToken(userObj);

    // Return cookie + JSON payload (cookie is HTTP only)
    const response = NextResponse.json(
      {
        success: true,
        data: { user: userObj, token },
        message: "Login successful",
      },
      { status: 200 }
    );

    // console.log('Login successful for user:', response);
    // cookie options: httpOnly true
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
