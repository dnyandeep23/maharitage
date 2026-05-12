import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import Site from "../../../../models/Site";
import TempSite from "../../../../models/TempSite";
import User from "../../../../models/User";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();

    const [
      totalUsers,
      publicUsers,
      researchExperts,
      admins,
      heritageSites,
      pendingApprovals,
      inscriptionTotals,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "public-user" }),
      User.countDocuments({ role: "research-expert" }),
      User.countDocuments({ role: "admin" }),
      Site.countDocuments(),
      TempSite.countDocuments({ status: "pending" }),
      Site.aggregate([
        {
          $project: {
            inscriptionCount: {
              $cond: [{ $isArray: "$inscriptions" }, { $size: "$inscriptions" }, 0],
            },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$inscriptionCount" },
          },
        },
      ]),
    ]);

    return NextResponse.json(
      {
        totalUsers,
        publicUsers,
        researchExperts,
        admins,
        heritageSites,
        pendingApprovals,
        inscriptions: inscriptionTotals[0]?.total || 0,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Unable to load dashboard stats" },
      { status: 500 }
    );
  }
}
