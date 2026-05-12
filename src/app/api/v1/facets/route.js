import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import { getFacets } from "../../../../lib/heritageApi";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json(await getFacets());
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

