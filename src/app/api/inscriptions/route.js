import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongoose";
import Site from "../../../models/Site";
import cloudinary from "../../../lib/cloudinary";
import { promises as fs } from "fs";
import path from "path";

import { adminAuth } from "../../../middleware/adminAuth";

async function createInscription(req) {
  try {
    await connectDB();
    const formData = await req.formData();
    const inscriptionData = JSON.parse(formData.get("inscriptionData"));
    const siteId = formData.get("siteId");
    const files = formData.getAll("images");

    const imageUrls = await Promise.all(
      files.map(async (file) => {
        const fileBuffer = await file.arrayBuffer();
        const mimeType = file.type;
        const encoding = "base64";
        const base64Data = Buffer.from(fileBuffer).toString("base64");
        const fileUri = "data:" + mimeType + ";" + encoding + "," + base64Data;
        const result = await cloudinary.uploader.upload(fileUri, {
          folder: "inscriptions",
        });
        return result.secure_url;
      })
    );

    inscriptionData.image_urls = imageUrls;

    const site = await Site.findOne({ site_id: siteId });
    if (!site) {
      return NextResponse.json({ message: "Site not found" }, { status: 404 });
    }

    site.Inscriptions.push(inscriptionData);
    await site.save();

    return NextResponse.json({
      message: "Inscription added successfully",
      site,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export const POST = adminAuth(createInscription);
