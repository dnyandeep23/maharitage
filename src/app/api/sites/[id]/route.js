import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import Site from "../../../../models/Site";
import cloudinary from "../../../../lib/cloudinary";

import { adminAuth } from "../../../../middleware/adminAuth";

export async function GET(request, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const site = await Site.findOne({ site_id: id });
    
    if (!site) {
      return NextResponse.json({ message: "Site not found" }, { status: 404 });
    }
    return NextResponse.json(site);
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function updateSite(req, { params }) {
  await connectDB();
  const { id } = await params;

  try {
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

    const existingSite = await Site.findOne({ site_id: id });
    if (!existingSite) {
      return NextResponse.json({ message: "Site not found" }, { status: 404 });
    }

    const existingImageUrls = existingSite.Gallary || [];
    const newImageUrls = siteData.Gallary || [];
    const deletedImageUrls = existingImageUrls.filter(
      (url) => !newImageUrls.includes(url)
    );

    if (deletedImageUrls.length > 0) {
      const publicIdsToDelete = deletedImageUrls.map((url) => {
        const parts = url.split("/");
        const publicIdWithExtension = parts[parts.length - 1];
        const publicId = publicIdWithExtension.split(".")[0];
        return `sites/${publicId}`;
      });
      await cloudinary.api.delete_resources(publicIdsToDelete);
    }

    if (imageUrls.length > 0) {
      siteData.Gallary = [...newImageUrls, ...imageUrls];
    }

    const updatedSite = await Site.findOneAndUpdate({ site_id: id }, siteData, {
      new: true,
    });

    return NextResponse.json({
      message: "Site updated successfully",
      site: updatedSite,
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

async function deleteSite(request, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const site = await Site.findOne({ site_id: id });
    if (!site) {
      return NextResponse.json({ message: "Site not found" }, { status: 404 });
    }

    const publicIdsToDelete = [];

    if (site.Inscriptions && site.Inscriptions.length > 0) {
      site.Inscriptions.forEach((inscription) => {
        if (inscription.image_urls && inscription.image_urls.length > 0) {
          const inscriptionPublicIds = inscription.image_urls.map((url) => {
            const parts = url.split("/");
            const publicIdWithExtension = parts[parts.length - 1];
            const publicId = publicIdWithExtension.split(".")[0];
            return `inscriptions/${publicId}`;
          });
          publicIdsToDelete.push(...inscriptionPublicIds);
        }
      });
    }

    if (site.Gallary && site.Gallary.length > 0) {
      const sitePublicIds = site.Gallary.map((url) => {
        const parts = url.split("/");
        const publicIdWithExtension = parts[parts.length - 1];
        const publicId = publicIdWithExtension.split(".")[0];
        return `sites/${publicId}`;
      });
      publicIdsToDelete.push(...sitePublicIds);
    }

    if (publicIdsToDelete.length > 0) {
      await cloudinary.api.delete_resources(publicIdsToDelete);
    }

    await Site.findOneAndDelete({ site_id: id });

    return NextResponse.json({ message: "Site deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export const PUT = adminAuth(updateSite);
export const DELETE = adminAuth(deleteSite);
