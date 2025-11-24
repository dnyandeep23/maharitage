import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import Site from "../../../../models/Site";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const siteNameQuery = searchParams.get("site_name");

    let sites;
    if (siteNameQuery) {
      const regex = new RegExp(siteNameQuery, "i"); // Case-insensitive search
      sites = await Site.find({ site_name: regex, "Inscriptions.0": { $exists: true } }).select(
        "site_id site_name Inscriptions"
      );
    } else {
      sites = await Site.find({ "Inscriptions.0": { $exists: true } }).select(
        "site_id site_name Inscriptions"
      );
    }

    const allInscriptions = sites.flatMap((site) =>
      site.Inscriptions.map((inscription) => ({
        Inscription_id: inscription.Inscription_id,
        discription: inscription.discription,
        site_id: site.site_id,
        site_name: site.site_name,
      }))
    );

    return NextResponse.json(allInscriptions);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
