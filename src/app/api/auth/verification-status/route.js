import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose.js";
import User from "../../../../models/User.js";
import { handleApiError } from "../../../../middleware/auth.js";

export async function GET(request) {
  try {
    await connectDB();
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Database connection failed" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email }).select("isEmailVerified");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      success: user.isEmailVerified,
      isEmailVerified: user.isEmailVerified,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
