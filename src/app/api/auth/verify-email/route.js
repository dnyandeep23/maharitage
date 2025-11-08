import { NextResponse } from "next/server";
import User from "../../../../models/User.js";
import { verifyToken } from "../../../../lib/jwt.js";
import connectDB from "../../../../lib/mongoose.js";
import { handleApiError } from "../../../../middleware/auth.js";

export async function POST(request) {
  try {
    await connectDB();
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
        { status: 400 }
      );
    }

    var decoded;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    if (user.isEmailVerified) {
      return NextResponse.json({
        success: true,
        message: "Email already verified",
      });
    }

    user.isEmailVerified = true;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
