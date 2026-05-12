import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import Site from "../../../../models/Site";
import { escapeRegex, scoreSite, siteSummary } from "../../../../lib/heritageApi";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("site_id");
    const district = searchParams.get("district");
    const heritageType = searchParams.get("heritage_type");
    const q = searchParams.get("q") || "";
    const limit = Math.min(Number(searchParams.get("limit")) || 6, 20);
    const terms = q.split(/\s+/).filter(Boolean);
    const clauses = [];

    let source = null;
    if (siteId) {
      source = await Site.findOne({ site_id: siteId }).lean();
      if (source) {
        clauses.push(
          { h_type: source.h_type },
          { heritage_type: source.heritage_type },
          { "location.district": source.location?.district },
          {
            "historical_context.ruler_or_dynasty":
              source.historical_context?.ruler_or_dynasty,
          }
        );
      }
    }

    if (district) clauses.push({ "location.district": new RegExp(escapeRegex(district), "i") });
    if (heritageType) clauses.push({ heritage_type: new RegExp(escapeRegex(heritageType), "i") });
    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");
      clauses.push(
        { site_name: regex },
        { site_discription: regex },
        { heritage_type: regex },
        { "historical_context.cultural_significance": regex }
      );
    }

    const query = clauses.length ? { $or: clauses.filter((clause) => Object.values(clause)[0]) } : {};
    if (source) query.site_id = { $ne: source.site_id };

    const sites = await Site.find(query)
      .select(
        "site_id site_name h_type location heritage_type period historical_context gallary inscriptions"
      )
      .limit(40)
      .lean();

    const data = sites
      .map((site) => ({
        ...siteSummary(site),
        relevance_score:
          scoreSite(site, terms) +
          (source && site.h_type === source.h_type ? 2 : 0) +
          (source && site.location?.district === source.location?.district ? 2 : 0),
      }))
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, limit);

    return NextResponse.json({
      source: source ? siteSummary(source) : null,
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

