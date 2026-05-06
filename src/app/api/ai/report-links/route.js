import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import Site from "../../../../models/Site";

const SITE_CACHE_TTL = 1000 * 60 * 30;
let siteCache = {
  data: [],
  lastFetched: 0,
};

const normalize = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getCachedSites = async (forceRefresh = false) => {
  if (
    !forceRefresh &&
    siteCache.data.length > 0 &&
    Date.now() - siteCache.lastFetched < SITE_CACHE_TTL
  ) {
    return siteCache.data;
  }

  const sites = await Site.find({})
    .select("site_id site_name")
    .lean();

  siteCache = {
    data: sites,
    lastFetched: Date.now(),
  };

  return sites;
};

const addAlias = (aliases, value) => {
  const normalized = normalize(value);
  if (normalized) aliases.add(normalized);
};

const buildAliases = (site) => {
  const base = normalize(site.site_name);
  const aliases = new Set([base]);
  aliases.add(base.replace(/\bcaves?\b/g, "").trim());
  aliases.add(base.replace(/\bcave\b/g, "").trim());
  aliases.add(base.replace(/\bfort\b/g, "").trim());
  aliases.add(base.replace(/\btemple\b/g, "").trim());
  aliases.add(base.replace(/\bcomplex\b/g, "").trim());

  // Heritage-specific alternate names used across quizzes and explanations.
  if (/\belephanta\b|\bgharapuri\b/.test(base)) {
    addAlias(aliases, "Elephanta");
    addAlias(aliases, "Elephanta Caves");
    addAlias(aliases, "Gharapuri");
    addAlias(aliases, "Gharapuri Island");
    addAlias(aliases, "Gharapuri Caves");
  }

  if (/\bpitalkhora\b|\bbrazen glen\b/.test(base)) {
    addAlias(aliases, "Pitalkhora");
    addAlias(aliases, "Pitalkhora Caves");
    addAlias(aliases, "Brazen Glen");
  }

  if (/\bkanheri\b|\bkrishnagiri\b/.test(base)) {
    addAlias(aliases, "Kanheri");
    addAlias(aliases, "Kanheri Caves");
    addAlias(aliases, "Krishnagiri");
  }

  return [...aliases].filter(Boolean);
};

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const scoreAliasMatch = (text, alias) => {
  if (!text || !alias) return 0;

  const exactPattern = new RegExp(`\\b${escapeRegex(alias)}\\b`, "i");
  if (exactPattern.test(text)) {
    return 1000 + alias.length;
  }

  if (text.includes(alias)) {
    return 100 + alias.length;
  }

  return 0;
};

const resolveSiteForText = (text, sites) => {
  const haystack = normalize(text);
  if (!haystack) return null;

  let bestMatch = null;
  let bestScore = 0;

  for (const site of sites) {
    const aliases = buildAliases(site);
    for (const alias of aliases) {
      if (!alias) continue;
      const score = scoreAliasMatch(haystack, alias);
      if (score > bestScore) {
        bestMatch = site;
        bestScore = score;
      }
    }
  }

  return bestMatch;
};

const resolveSiteForItem = (item, topic, sites) => {
  const questionMatch = resolveSiteForText(item?.question || "", sites);
  if (questionMatch) {
    return questionMatch;
  }

  const explanationMatch = resolveSiteForText(item?.explanation || "", sites);
  if (explanationMatch) {
    return explanationMatch;
  }

  return resolveSiteForText(topic || "", sites);
};

export async function POST(request) {
  await connectDB();

  try {
    const { items = [], topic = "" } = await request.json();
    const sites = await getCachedSites();

    const resolvedItems = [];
    let freshSites = null;

    for (const item of items) {
      let site = resolveSiteForItem(item, topic, sites);

      if (!site) {
        if (!freshSites) {
          freshSites = await getCachedSites(true);
        }
        site = resolveSiteForItem(item, topic, freshSites);
      }

      resolvedItems.push({
        ...item,
        site: site
          ? {
              site_id: site.site_id,
              site_name: site.site_name,
              href: `/cave/${site.site_id}`,
            }
          : null,
      });
    }

    return NextResponse.json({ items: resolvedItems });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to resolve report links." },
      { status: 500 }
    );
  }
}
