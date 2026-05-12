import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import Site from "../../../../models/Site";
import {
  escapeRegex,
  getPagination,
  inscriptionSummary,
} from "../../../../lib/heritageApi";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const siteNameQuery = searchParams.get("site_name");
    const siteId = searchParams.get("site_id");
    const district = searchParams.get("district");
    const language = searchParams.get("language");
    const q = searchParams.get("q") || searchParams.get("query");
    const { page, limit, skip } = getPagination(searchParams);

    const siteQuery = { "inscriptions.0": { $exists: true } };
    if (siteNameQuery) {
      siteQuery.site_name = new RegExp(escapeRegex(siteNameQuery), "i");
    }
    if (siteId) siteQuery.site_id = siteId;
    if (district) {
      siteQuery["location.district"] = new RegExp(escapeRegex(district), "i");
    }

    const sites = await Site.find(siteQuery).select(
      "site_id site_name location inscriptions"
    );

    const regex = q ? new RegExp(escapeRegex(q), "i") : null;
    const languageRegex = language
      ? new RegExp(escapeRegex(language), "i")
      : null;
    const allInscriptions = sites.flatMap((site) =>
      (site.inscriptions || [])
        .filter((inscription) => {
          if (
            languageRegex &&
            !languageRegex.test(inscription.language_detected || "")
          ) {
            return false;
          }

          if (!regex) return true;
          return [
            inscription.discription,
            inscription.description,
            inscription.original_script,
            inscription.language_detected,
            inscription.translations?.english,
            inscription.translations?.hindi,
          ].some((value) => regex.test(value || ""));
        })
        .map((inscription) => inscriptionSummary(inscription, site))
    );

    return NextResponse.json({
      data: allInscriptions.slice(skip, skip + limit),
      pagination: {
        page,
        limit,
        total: allInscriptions.length,
        pages: Math.ceil(allInscriptions.length / limit),
      },
      filters: Object.fromEntries(searchParams.entries()),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
