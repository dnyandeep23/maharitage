import { NextResponse } from "next/server";
import ApiKey from "../models/ApiKey";
import connectDB from "./mongoose";

export async function verifyApiKey(req) {
  await connectDB();
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey) {
    return {
      authorized: false,
      response: NextResponse.json(
        { message: "API Key missing" },
        { status: 401 }
      ),
    };
  }

  const foundKey = await ApiKey.findOne({ key: apiKey });

  if (!foundKey) {
    return {
      authorized: false,
      response: NextResponse.json(
        { message: "Invalid API Key" },
        { status: 401 }
      ),
    };
  }

  // Update usage statistics
  foundKey.usage += 1;
  foundKey.lastUsed = new Date();
  await foundKey.save();

  return { authorized: true, userId: foundKey.user };
}
