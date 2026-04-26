import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import Site from "../../../../models/Site";

const normalize = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const buildAliases = (site) => {
  const base = normalize(site.site_name);
  const aliases = new Set([base]);
  aliases.add(base.replace(/\bcaves?\b/g, "").trim());
  aliases.add(base.replace(/\bcave\b/g, "").trim());
  aliases.add(base.replace(/\bfort\b/g, "").trim());
  aliases.add(base.replace(/\btemple\b/g, "").trim());
  aliases.add(base.replace(/\bcomplex\b/g, "").trim());
  return [...aliases].filter(Boolean);
};

const resolveSiteForText = (text, sites) => {
  const haystack = normalize(text);
  if (!haystack) return null;

  let bestMatch = null;
  let bestLength = 0;

  for (const site of sites) {
    const aliases = buildAliases(site);
    for (const alias of aliases) {
      if (!alias) continue;
      if (haystack.includes(alias) && alias.length > bestLength) {
        bestMatch = site;
        bestLength = alias.length;
      }
    }
  }

  return bestMatch;
};

export async function POST(request) {
  await connectDB();

  try {
    const { items = [], topic = "" } = await request.json();
    const sites = await Site.find({})
      .select("site_id site_name")
      .lean();

    const resolvedItems = items.map((item) => {
      const combinedText = [item.question, item.explanation, topic]
        .filter(Boolean)
        .join(" ");
      const site = resolveSiteForText(combinedText, sites);

      return {
        ...item,
        site: site
          ? {
              site_id: site.site_id,
              site_name: site.site_name,
              href: `${request.nextUrl.origin}/cave/${site.site_id}`,
            }
          : null,
      };
    });

    return NextResponse.json({ items: resolvedItems });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to resolve report links." },
      { status: 500 }
    );
  }
}
