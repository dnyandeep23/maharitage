import { NextResponse } from "next/server";
import Site from "../../../../models/Site";
import connectDB from "../../../../lib/mongoose";

export async function GET() {
  await connectDB();

  try {
    
    const [lastSite] = await Site.aggregate([
      {
        $addFields: {
          // extract last 4 characters of site_id
          last4: {
            $substr: [
              "$site_id",
              { $subtract: [{ $strLenCP: "$site_id" }, 4] },
              4,
            ],
          },
        },
      },
      {
        // convert "0014" → 14 for proper numeric sorting
        $addFields: {
          numericId: { $toInt: "$last4" },
        },
      },
      {
        $sort: { numericId: -1 },
      },
      { $limit: 1 },
    ]);
    
    if (lastSite) {
      return NextResponse.json({ last_id: lastSite.site_id });
    }
    return NextResponse.json({ last_id: "ABC0000" }); // Default if no sites
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching last site ID" },
      { status: 500 }
    );
  }
}
