import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import Site from "../../../../models/Site";

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const site = await Site.findOne({ site_id: id });
    if (!site) {
      return NextResponse.json({ message: "Site not found" }, { status: 404 });
    }
    return NextResponse.json(site);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
