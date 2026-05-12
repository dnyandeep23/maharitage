import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import Site from "../../../../models/Site";
import { siteSummary } from "../../../../lib/heritageApi";

export async function GET() {
  try {
    await connectDB();
    const sites = await Site.find({ period: { $exists: true, $ne: "" } })
      .select(
        "site_id site_name h_type location heritage_type period historical_context gallary inscriptions"
      )
      .lean();

    const data = sites
      .map((site) => ({
        period: site.period,
        approx_date: site.historical_context?.approx_date || null,
        site: siteSummary(site),
      }))
      .sort((a, b) => String(a.period).localeCompare(String(b.period)));

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

