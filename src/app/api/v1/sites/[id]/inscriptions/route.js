import { NextResponse } from "next/server";
import connectDB from "../../../../../../lib/mongoose";
import Site from "../../../../../../models/Site";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const site = await Site.findOne({ site_id: id }).select("Inscriptions");

    if (!site) {
      return NextResponse.json({ message: "Site not found" }, { status: 404 });
    }

    const inscriptions = site.Inscriptions.map((inscription) => ({
      Inscription_id: inscription.Inscription_id,
      language_detected: inscription.language_detected,
      discription: inscription.discription,
    }));

    return NextResponse.json(inscriptions);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
