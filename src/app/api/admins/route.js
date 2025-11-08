import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoose";
import User from "../../../models/User";
import { sendNewAdminEmail } from "../../../lib/email";
import crypto from "crypto";

import { adminAuth } from "../../../middleware/adminAuth";

async function getAdmins(request) {
  await connectDB();

  try {
    
    const admins = await User.find({ role: "admin" });
    
    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function createAdmin(request) {
  await connectDB();

  try {
    const { email, username } = await request.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    const temporaryPassword = crypto.randomBytes(8).toString("hex");

    const newUser = new User({
      username,
      email,
      password: temporaryPassword,
      role: "admin",
    });

    await newUser.save();

    await sendNewAdminEmail(email, username, temporaryPassword);

    return NextResponse.json({ message: "Admin created successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export const GET = adminAuth(getAdmins);
export const POST = adminAuth(createAdmin);
