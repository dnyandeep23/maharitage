import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoose";
import VisitorStats from "../../../models/VisitorStats";

const VISITOR_KEY = "site";

export async function GET() {
  try {
    await connectDB();
    const stats = await VisitorStats.findOneAndUpdate(
      { key: VISITOR_KEY },
      { $setOnInsert: { key: VISITOR_KEY, count: 0 } },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ count: stats?.count || 0 });
  } catch (error) {
    return NextResponse.json(
      { message: "Unable to load visitor count" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await connectDB();
    const stats = await VisitorStats.findOneAndUpdate(
      { key: VISITOR_KEY },
      { $inc: { count: 1 }, $setOnInsert: { key: VISITOR_KEY } },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json({ count: stats?.count || 0 });
  } catch (error) {
    return NextResponse.json(
      { message: "Unable to update visitor count" },
      { status: 500 }
    );
  }
}
