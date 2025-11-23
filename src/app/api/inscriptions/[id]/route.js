import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import Site from "../../../../models/Site";
import cloudinary from "../../../../lib/cloudinary";

import { adminAuth } from "../../../../middleware/adminAuth";

export async function GET(request, { params }) {
  await connectDB();
  const { id } = params;

  try {
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
    return NextResponse.json(inscription);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function updateInscription(req, { params }) {
  await connectDB();
  const { id } = params;

  try {
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

    const site = await Site.findOne({ site_id: siteId });
    if (!site) {
      return NextResponse.json({ message: "Site not found" }, { status: 404 });
    }

    const inscriptionIndex = site.Inscriptions.findIndex(
      (insc) => insc.Inscription_id === id
    );
    if (inscriptionIndex === -1) {
      return NextResponse.json(
        { message: "Inscription not found" },
        { status: 404 }
      );
    }

    const existingInscription = site.Inscriptions[inscriptionIndex];
    const existingImageUrls = existingInscription.image_urls || [];
    const newImageUrls = inscriptionData.image_urls || [];
    const deletedImageUrls = existingImageUrls.filter(
      (url) => !newImageUrls.includes(url)
    );

    if (deletedImageUrls.length > 0) {
      const publicIdsToDelete = deletedImageUrls.map((url) => {
        const parts = url.split("/");
        const publicIdWithExtension = parts[parts.length - 1];
        const publicId = publicIdWithExtension.split(".")[0];
        return `inscriptions/${publicId}`;
      });
      await cloudinary.api.delete_resources(publicIdsToDelete);
    }

    if (imageUrls.length > 0) {
      inscriptionData.image_urls = [...newImageUrls, ...imageUrls];
    }

    site.Inscriptions[inscriptionIndex] = {
      ...existingInscription,
      ...inscriptionData,
    };
    await site.save();

    return NextResponse.json({
      message: "Inscription updated successfully",
      inscription: site.Inscriptions[inscriptionIndex],
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

async function deleteInscription(request, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const site = await Site.findOne({ "Inscriptions.Inscription_id": id });
    if (!site) {
      return NextResponse.json(
        { message: "Inscription not found" },
        { status: 404 }
      );
    }

    const inscriptionIndex = site.Inscriptions.findIndex(
      (insc) => insc.Inscription_id === id
    );
    if (inscriptionIndex === -1) {
      return NextResponse.json(
        { message: "Inscription not found" },
        { status: 404 }
      );
    }

    const inscription = site.Inscriptions[inscriptionIndex];
    if (inscription.image_urls && inscription.image_urls.length > 0) {
      const publicIdsToDelete = inscription.image_urls.map((url) => {
        const parts = url.split("/");
        const publicIdWithExtension = parts[parts.length - 1];
        const publicId = publicIdWithExtension.split(".")[0];
        return `inscriptions/${publicId}`;
      });
      await cloudinary.api.delete_resources(publicIdsToDelete);
    }

    site.Inscriptions.splice(inscriptionIndex, 1);
    await site.save();

    return NextResponse.json({ message: "Inscription deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export const PUT = adminAuth(updateInscription);
export const DELETE = adminAuth(deleteInscription);
