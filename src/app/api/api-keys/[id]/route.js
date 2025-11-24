import { NextResponse } from "next/server";
import ApiKey from "../../../../models/ApiKey";
import User from "../../../../models/User";
import connectDB from "../../../../lib/mongoose";
import { verifyTokenMiddleware } from "../../../../lib/jwt";

export async function DELETE(req, { params }) {
  await connectDB();
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const decoded = await verifyTokenMiddleware(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found for token" },
        { status: 404 }
      );
    }

    const { id } = await params;

    const apiKey = await ApiKey.findOneAndDelete({ _id: id, user: user._id });

    if (!apiKey) {
      return NextResponse.json(
        { message: "API key not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "API key deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  await connectDB();
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized: No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyTokenMiddleware(token);

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return NextResponse.json(
        { message: "User not found for token" },
        { status: 404 }
      );
    }

    const { id } = await params;
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "API key name is required" },
        { status: 400 }
      );
    }

    const apiKey = await ApiKey.findOneAndUpdate(
      { _id: id, user: user._id },
      { name },
      { new: true }
    );

    if (!apiKey) {
      return NextResponse.json(
        { message: "API key not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "API key updated successfully", apiKey },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
