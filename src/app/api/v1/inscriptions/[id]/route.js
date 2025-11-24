import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongoose";
import Site from "../../../../../models/Site";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const site = await Site.findOne({ "Inscriptions.Inscription_id": id });

    if (!site) {
      return NextResponse.json(
        { message: "Inscription not found" },
        { status: 404 }
      );
    }

    const inscription = site.Inscriptions.find(
      (insc) => insc.Inscription_id === id
    );

    if (!inscription) {
      return NextResponse.json(
        { message: "Inscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(inscription);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
