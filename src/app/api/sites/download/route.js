import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongoose';
import Site from '../../../../models/Site';

import { adminAuth } from '../../../../middleware/adminAuth';

async function downloadSites(request) {
  await connectDB();
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('site_id');

  try {
    let sites;
    let filename = 'all_sites.json';

    if (siteId) {
      sites = await Site.find({ site_id: siteId }).lean();
      if (sites.length > 0) {
        filename = `${sites[0].site_name}.json`;
      }
    } else {
      sites = await Site.find().lean();
    }

    // Recursively remove _id and __v
    const cleanSites = (obj) => {
        if (Array.isArray(obj)) {
            return obj.map(v => cleanSites(v));
        } else if (obj !== null && typeof obj === 'object') {
            delete obj._id;
            delete obj.__v;
            for (const key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    obj[key] = cleanSites(obj[key]);
                }
            }
        }
        return obj;
    };

    const cleanedSites = cleanSites(sites);

    const replacer = [
      "site_id",
      "site_name",
      "location",
      "Site_discription",
      "heritage_type",
      "period",
      "historical_context",
      "verification_authority",
      "references",
      "Gallary",
      "Inscriptions",
      "latitude",
      "longitude",
      "district",
      "state",
      "country",
      "ruler_or_dynasty",
      "approx_date",
      "related_figures",
      "cultural_significance",
      "curated_by",
      "title",
      "author",
      "year",
      "url",
      "Inscription_id",
      "discription",
      "original_script",
      "language_detected",
      "image_urls"
    ];

    const json = JSON.stringify(cleanedSites, replacer, 2);
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(json, { headers });

  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error', error }, { status: 500 });
  }
}

export const GET = adminAuth(downloadSites);
