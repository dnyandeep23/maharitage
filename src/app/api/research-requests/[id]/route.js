import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import TempSite from "../../../../models/TempSite";
import Site from "../../../../models/Site";

import User from "../../../../models/User";
import { sendEmail } from "../../../../lib/email";
import cloudinary from "../../../../lib/cloudinary";

export async function GET(req, { params }) {
  await connectDB();
  const { id } = params;
  try {
    const request = await TempSite.findById(id).populate(
      "researchExpertId",
      "username email"
    );

    if (!request) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(request, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching pending request", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  await connectDB();
  const { id } = await params;

  try {
    const { status, adminFeedback } = await req.json();

    const tempSite = await TempSite.findById(id);

    if (!tempSite) {
      return NextResponse.json(
        { message: "Request not found" },
        { status: 404 }
      );
    }

    if (status === "approved") {
      const siteData = tempSite.toObject();
      delete siteData._id;
      delete siteData.status;
      delete siteData.adminFeedback;
      delete siteData.researchExpertId;
      await Site.findOneAndUpdate({ site_id: tempSite.site_id }, siteData, {
        upsert: true,
        new: true,
      });
      tempSite.status = "approved";
      tempSite.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await tempSite.save();
    } else if (status === "rejected") {
      const getPublicIdFromUrl = (url) => {
        const regex = /v\d+\/(.+?)\.\w+$/;
        const match = url.match(regex);
        return match ? match[1] : null;
      };

      const imagesToDelete = [];
      if (tempSite.Gallary) {
        imagesToDelete.push(...tempSite.Gallary);
      }
      if (tempSite.Inscriptions) {
        tempSite.Inscriptions.forEach((inscription) => {
          if (inscription.image_urls) {
            imagesToDelete.push(...inscription.image_urls);
          }
        });
      }

      if (imagesToDelete.length > 0) {
        const publicIds = imagesToDelete
          .map(getPublicIdFromUrl)
          .filter((id) => id);
        if (publicIds.length > 0) {
          try {
            await Promise.all(
              publicIds.map((publicId) => cloudinary.uploader.destroy(publicId))
            );
          } catch (cloudinaryError) {}
        }
      }
      tempSite.status = "rejected";
      tempSite.adminFeedback = adminFeedback;
      tempSite.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      await tempSite.save();
    } else {
      tempSite.status = status;
      tempSite.adminFeedback = adminFeedback;
      await tempSite.save();
    }

    // Send email to Research Expert
    const researchExpert = await User.findById(tempSite.researchExpertId);
    const researchExpertEmail = researchExpert.email;
    const emailSubject = `Your Research Request for site ${tempSite.site_name} has been ${status}`;
    let emailBody = `Dear ${researchExpert.username},

Your request for the site ${tempSite.site_name} has been ${status}.`;

    if (adminFeedback) {
      emailBody += `
Admin Feedback: ${adminFeedback}`;
    }
    emailBody += `

Thank you for your contribution.`;

    await sendEmail({
      to: researchExpertEmail,
      subject: emailSubject,
      html: `<p>${emailBody.replace(/\n/g, "<br/>")}</p>`,
    });

    return NextResponse.json(
      { message: "Request updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error updating pending request", error: error.message },
      { status: 500 }
    );
  }
}
