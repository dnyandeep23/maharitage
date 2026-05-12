import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongoose";
import Site from "../../../../../models/Site";
import { escapeRegex, scoreSite, siteSummary } from "../../../../../lib/heritageApi";

function snippet(value = "", query = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return null;
  const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  const start = Math.max(index - 90, 0);
  return text.slice(start, start + 260);
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || searchParams.get("q");
    const limit = Math.min(Number(searchParams.get("limit")) || 5, 20);

    if (!query) {
      return NextResponse.json(
        { message: "query is required" },
        { status: 400 }
      );
    }

    const regex = new RegExp(escapeRegex(query), "i");
    const terms = query.split(/\s+/).filter(Boolean);
    const sites = await Site.find({
      $or: [
        { site_name: regex },
        { site_discription: regex },
        { heritage_type: regex },
        { h_type: regex },
        { period: regex },
        { "location.district": regex },
        { "historical_context.ruler_or_dynasty": regex },
        { "historical_context.cultural_significance": regex },
        { "inscriptions.discription": regex },
        { "inscriptions.description": regex },
        { "inscriptions.translations.english": regex },
      ],
    })
      .select(
        "site_id site_name h_type location heritage_type period historical_context site_discription inscriptions gallary references"
      )
      .limit(30)
      .lean();

    const data = sites
      .map((site) => ({
        site: siteSummary(site),
        score: scoreSite(site, terms),
        context: {
          description: snippet(site.site_discription, query),
          cultural_significance: snippet(
            site.historical_context?.cultural_significance,
            query
          ),
          inscription:
            (site.inscriptions || [])
              .map((item) =>
                snippet(
                  item.discription ||
                    item.description ||
                    item.translations?.english,
                  query
                )
              )
              .find(Boolean) || null,
        },
        suggested_calls: [
          `/api/v1/sites/${site.site_id}`,
          `/api/v1/sites/${site.site_id}/related`,
          `/api/v1/sites/${site.site_id}/gallery`,
        ],
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({
      query,
      mode: "schema-aware keyword ranking",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
