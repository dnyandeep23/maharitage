import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import { paginatedSites } from "../../../../lib/heritageApi";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const result = await paginatedSites(searchParams, { h_type: /^cave$/i });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

