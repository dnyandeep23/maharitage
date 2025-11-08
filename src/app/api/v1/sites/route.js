import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import Site from "../../../../models/Site";

export async function GET(req) {
  const apiKey = req.headers.get("x-api-key");

  if (apiKey !== "MAHARITAGE_TEST_KEY") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const sites = await Site.find().select(
      "site_id site_name location.district heritage_type period"
    );

    const formattedSites = sites.map((site) => ({
      site_id: site.site_id,
      site_name: site.site_name,
      district: site.location.district,
      heritage_type: site.heritage_type,
      period: site.period,
    }));

    return NextResponse.json(formattedSites);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}