import { NextResponse } from "next/server";
import ApiKey from "../../../models/ApiKey";
import User from "../../../models/User";
import connectDB from "../../../lib/mongoose";
import { verifyTokenMiddleware } from "../../../lib/jwt";
import crypto from "crypto";
export async function GET(req) {
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

    const apiKeys = await ApiKey.find({ user: user._id });
    return NextResponse.json({ apiKeys }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
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

    const existingKeys = await ApiKey.find({ user: user._id });

    if (existingKeys.length >= 3) {
      return NextResponse.json(
        { message: "You can only have a maximum of 3 API keys." },
        { status: 400 }
      );
    }

    const { name } = await req.json();
    
    if (!name) {
      return NextResponse.json(
        { message: "API key name is required" },
        { status: 400 }
      );
    }

    const newKey = new ApiKey({
      key: crypto.randomBytes(16).toString("hex"),
      user: user._id,
      name,
    });

    await newKey.save();

    return NextResponse.json(
      { message: "API key created successfully", apiKey: newKey },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
