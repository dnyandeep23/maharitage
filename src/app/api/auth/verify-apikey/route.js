import { NextResponse } from "next/server";
import connect from "../../../../lib/mongoose";
import ApiKey from "../../../../models/ApiKey";
import User from "../../../../models/User";

export async function POST(request) {
  await connect();
  const { apiKey } = await request.json();

  if (!apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 });
  }

  try {
    const keyDoc = await ApiKey.findOne({ key: apiKey }).populate("user");
    if (!keyDoc) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    if (!keyDoc.user) {
      return NextResponse.json(
        { error: "User not found for this API key" },
        { status: 404 }
      );
    }

    const user = {
      _id: keyDoc.user._id,
      role: keyDoc.user.role,
    };

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
