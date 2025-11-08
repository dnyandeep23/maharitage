import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongoose";
import Site from "../../../../../models/Site";

export async function GET(req, { params }) {
  const apiKey = req.headers.get("x-api-key");

  if (apiKey !== "MAHARITAGE_TEST_KEY") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = params;

    const site = await Site.findOne({ site_id: id }).select(
      "site_name location heritage_type Site_discription period historical_context verification_authority Gallary"
    );

    if (!site) {
      return NextResponse.json({ message: "Site not found" }, { status: 404 });
    }

    return NextResponse.json(site);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}