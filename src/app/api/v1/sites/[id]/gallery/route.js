import { NextResponse } from "next/server";
import connectDB from "../../../../../../lib/mongoose";
import Site from "../../../../../../models/Site";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const site = await Site.findOne({ site_id: id })
      .select("site_id site_name gallary")
      .lean();

    if (!site) {
      return NextResponse.json({ message: "Site not found" }, { status: 404 });
    }

    return NextResponse.json({
      site_id: site.site_id,
      site_name: site.site_name,
      data: (site.gallary || []).map((url, index) => ({
        id: `${site.site_id}-media-${index + 1}`,
        type: "image",
        url,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

