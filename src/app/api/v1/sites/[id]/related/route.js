import { NextResponse } from "next/server";
import connectDB from "../../../../../../lib/mongoose";
import Site from "../../../../../../models/Site";
import { siteSummary } from "../../../../../../lib/heritageApi";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const site = await Site.findOne({ site_id: id }).lean();

    if (!site) {
      return NextResponse.json({ message: "Site not found" }, { status: 404 });
    }

    const related = await Site.find({
      site_id: { $ne: site.site_id },
      $or: [
        { h_type: site.h_type },
        { heritage_type: site.heritage_type },
        { "location.district": site.location?.district },
        {
          "historical_context.ruler_or_dynasty":
            site.historical_context?.ruler_or_dynasty,
        },
      ].filter((condition) => Object.values(condition)[0]),
    })
      .select(
        "site_id site_name h_type location heritage_type period historical_context gallary inscriptions"
      )
      .limit(6)
      .lean();

    return NextResponse.json({
      source: siteSummary(site),
      data: related.map(siteSummary),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

