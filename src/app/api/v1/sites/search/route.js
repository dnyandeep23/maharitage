import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongoose";
import { paginatedSites } from "../../../../../lib/heritageApi";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { message: "Search query 'q' is required" },
        { status: 400 }
      );
    }

    return NextResponse.json(await paginatedSites(searchParams));
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
