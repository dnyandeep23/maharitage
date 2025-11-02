import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoose";
import Site from "../../../models/Site";

export async function GET() {
  try {
    await connectDB();
    const sites = await Site.find(
      {},
      { site_id: 1, site_name: 1, location: 1, Gallary: { $slice: 1 }, _id: 0 }
    );
    return NextResponse.json(sites);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
