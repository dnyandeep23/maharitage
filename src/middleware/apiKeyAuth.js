import { NextResponse } from "next/server";
import ApiKey from "../models/ApiKey";
import { connectDB } from "../lib/mongoose";

export async function apiKeyAuth(req) {
  await connectDB();
  const apiKey = req.headers.get("x-api-key");
  console.log("API Key:", apiKey);

  if (!apiKey) {
    return NextResponse.json({ message: "API Key missing" }, { status: 401 });
  }

  const foundKey = await ApiKey.findOne({ key: apiKey });

  if (!foundKey) {
    return NextResponse.json({ message: "Invalid API Key" }, { status: 401 });
  }

  // Update usage statistics
  foundKey.usage += 1;
  foundKey.lastUsed = new Date();
  await foundKey.save();

  // Attach user ID to the request for further processing if needed
  req.userId = foundKey.user;

  return NextResponse.next();
}
