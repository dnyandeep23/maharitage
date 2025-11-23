import Site from "../../../models/Site";
import TempSite from "../../../models/TempSite";
import User from "../../../models/User";
import { sendEmail } from "../../../lib/email";
import PendingRequest from "../../../models/PendingRequest";
import connectDB from "../../../lib/mongoose";
import { NextResponse } from "next/server";
import cloudinary from "../../../lib/cloudinary";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const researchExpertId = searchParams.get("researchExpertId");

  try {
    const query = researchExpertId ? { researchExpertId } : {};
    const tempSites = await TempSite.find(query)
      .populate("researchExpertId", "username email")
      .lean();

    const requests = await Promise.all(
      tempSites.map(async (tempSite) => {
        if (tempSite.action === "modify") {
          const originalSite = await Site.findOne({
            site_id: tempSite.site_id,
          }).lean();
          return { ...tempSite, originalSite };
        }
        return tempSite;
      })
    );

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching pending requests", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  // Connect to the database
  await connectDB();

  try {
    console.log("Received new research request");
    const formData = await req.formData();
    const type = formData.get("type");
    const action = formData.get("action");
    const data = JSON.parse(formData.get("data"));
    const researchExpertId = formData.get("researchExpertId");
    const files = formData.getAll("images");

    let tempSite;
    console.log(formData);

    const imageUrls = await Promise.all(
      files.map(async (file) => {
        const fileBuffer = await file.arrayBuffer();
        const mimeType = file.type;
        const encoding = "base64";
        const base64Data = Buffer.from(fileBuffer).toString("base64");
        const fileUri = "data:" + mimeType + ";" + encoding + "," + base64Data;
        const result = await cloudinary.uploader.upload(fileUri, {
          folder: type === "site" ? "sites" : "inscriptions",
        });
        return result.secure_url;
      })
    );

    if (type === "site") {
      data.Gallary = imageUrls;

      if (action === "add") {
        tempSite = new TempSite({ ...data, researchExpertId, type, action });
        await tempSite.save();
      } else if (action === "modify") {
        const site = await Site.findOne({ site_id: data.site_id })
          .select("-_id")
          .lean();
        const tempSiteDoc = new TempSite({
          ...site,
          ...data,
          researchExpertId,
          type,
          action,
        });

        const { _id, __v, ...cleanData } = tempSiteDoc.toObject();

        const tempSite = new TempSite(cleanData);
        await tempSite.save();
      }
    } else if (type === "inscription") {
      data.image_urls = imageUrls;

      const site = await Site.findOne({ site_id: data.site_id })
        .select("-_id")
        .lean();
      tempSite = new TempSite({ ...site, researchExpertId, type, action });
      if (action === "add") {
        tempSite.Inscriptions.push(data);
      } else if (action === "modify") {
        const inscriptionIndex = tempSite.Inscriptions.findIndex(
          (i) => i.Inscription_id === data.Inscription_id
        );
        if (inscriptionIndex > -1) {
          tempSite.Inscriptions[inscriptionIndex] = data;
        }
      }
      await tempSite.save();
    }

    // Find all admin users
    const admins = await User.find({ role: "admin" });
    const adminEmails = admins.map((admin) => admin.email);

    // If there are admin users, send them an email notification
    if (adminEmails.length > 0) {
      // Get the research expert's details
      const researchExpert = await User.findById(researchExpertId);

      // Create the email subject and body
      const emailSubject = `New Research Expert Request: ${type} ${action}`;
      const emailBody = `A new request has been submitted by Research Expert ${
        researchExpert?.username
      } (${
        researchExpert?.email
      }).\n\nType: ${type}\nAction: ${action}\nData: ${JSON.stringify(
        data,
        null,
        2
      )}\n\nPlease review this request in the admin dashboard.`;

      // Send the email
      await sendEmail({
        to: adminEmails,
        subject: emailSubject,
        html: `<p>${emailBody.replace(/\n/g, "<br/>")}</p>`,
      });
    }

    // Return a success response
    return NextResponse.json(
      { message: "Request submitted successfully", tempSite },
      { status: 201 }
    );
  } catch (error) {
    // Log the error and return an error response
    console.error("Error submitting request:", error);
    return NextResponse.json(
      { message: "Error submitting request", error: error.message },
      { status: 500 }
    );
  }
}
