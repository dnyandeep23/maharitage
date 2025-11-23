import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoose";
import Site from "../../../models/Site";
import cloudinary from "../../../lib/cloudinary";

import { adminAuth } from "../../../middleware/adminAuth";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    let sites;
    if (query) {
      const regex = new RegExp(query, "i"); // i for case-insensitive
      sites = await Site.find({
        $or: [
          { site_name: regex },
          { Site_discription: regex },
          { period: regex },
          { "location.district": regex },
          { "location.state": regex },
          { "historical_context.ruler_or_dynasty": regex },
        ],
      });
    } else {
      sites = await Site.find();
    }

    return NextResponse.json(sites);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function createSite(req) {
  try {
    console.log("Creating new site");
    await connectDB();
    const formData = await req.formData();
    const siteData = JSON.parse(formData.get("siteData"));
    const files = formData.getAll("images");

    const imageUrls = await Promise.all(
      files.map(async (file) => {
        const fileBuffer = await file.arrayBuffer();
        const mimeType = file.type;
        const encoding = "base64";
        const base64Data = Buffer.from(fileBuffer).toString("base64");
        const fileUri = "data:" + mimeType + ";" + encoding + "," + base64Data;
        const result = await cloudinary.uploader.upload(fileUri, {
          folder: "sites",
        });
        return result.secure_url;
      })
    );

    siteData.Gallary = imageUrls;

    const newSite = new Site(siteData);
    await newSite.save();

    return NextResponse.json({
      message: "Site created successfully",
      site: newSite,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export const POST = adminAuth(createSite);
