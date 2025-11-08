import { NextResponse } from "next/server";
import Site from "../../../../../models/Site";
import connectDB from "../../../../../lib/mongoose";

export async function GET(request, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const site = await Site.findOne({ site_id: id });
    if (!site) {
      return NextResponse.json({ message: "Site not found" }, { status: 404 });
    }

    const lastInscription = site.Inscriptions[site.Inscriptions.length - 1];
    if (lastInscription) {
      return NextResponse.json({ last_id: lastInscription.Inscription_id });
    }

    return NextResponse.json({ last_id: "Insc_00" });
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching last inscription ID", error },
      { status: 500 }
    );
  }
}
