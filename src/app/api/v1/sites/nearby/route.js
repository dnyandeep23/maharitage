import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongoose";
import Site from "../../../../../models/Site";
import { haversineKm, siteSummary } from "../../../../../lib/heritageApi";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const latitude = Number(searchParams.get("lat"));
    const longitude = Number(searchParams.get("lng"));
    const radiusKm = Number(searchParams.get("radiusKm")) || 150;
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { message: "lat and lng query parameters are required" },
        { status: 400 }
      );
    }

    const sites = await Site.find({
      "location.latitude": { $type: "number" },
      "location.longitude": { $type: "number" },
    })
      .select(
        "site_id site_name h_type location heritage_type period historical_context gallary inscriptions"
      )
      .lean();

    const origin = { latitude, longitude };
    const data = sites
      .map((site) => ({
        ...siteSummary(site),
        distance_km: Number(
          haversineKm(origin, {
            latitude: site.location.latitude,
            longitude: site.location.longitude,
          }).toFixed(2)
        ),
      }))
      .filter((site) => site.distance_km <= radiusKm)
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, limit);

    return NextResponse.json({ origin, radius_km: radiusKm, data });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

