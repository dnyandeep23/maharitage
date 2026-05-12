import fs from "node:fs/promises";
import path from "node:path";
import connectDB from "./mongoose";
import Site from "../models/Site";
import { getFacets, inscriptionId, siteSummary } from "./heritageApi";

const API_ROOT = path.join(process.cwd(), "src/app/api/v1");

const ENDPOINT_META = {
  "/api/v1/sites": {
    title: "List Heritage Sites",
    category: "Heritage Sites",
    description:
      "Returns paginated heritage site summaries with filters derived from real site metadata.",
    query: [
      ["q", "string", "Search name, description, period, district, dynasty."],
      ["district", "string", "Filter by location district."],
      ["heritage_type", "string", "Filter by heritage classification."],
      ["h_type", "string", "Filter by normalized class such as cave or fort."],
      ["page", "number", "Page number."],
      ["limit", "number", "Results per page, max 50."],
    ],
  },
  "/api/v1/sites/search": {
    title: "Search Sites",
    category: "Search",
    description:
      "Full-text style keyword search across schema-supported site fields.",
    query: [["q", "string", "Required search term."]],
  },
  "/api/v1/sites/[id]": {
    title: "Get Site Detail",
    category: "Heritage Sites",
    description:
      "Returns a full site document including location, gallery, references, and embedded inscriptions.",
    params: [["id", "string", "Site ID, for example Aja0003."]],
  },
  "/api/v1/sites/[id]/inscriptions": {
    title: "List Site Inscriptions",
    category: "Inscriptions",
    description:
      "Returns inscription summaries embedded under a specific heritage site.",
    params: [["id", "string", "Site ID."]],
  },
  "/api/v1/sites/[id]/gallery": {
    title: "Get Site Gallery",
    category: "Media",
    description:
      "Returns gallery media URLs attached to a specific heritage site.",
    params: [["id", "string", "Site ID."]],
  },
  "/api/v1/sites/[id]/related": {
    title: "Related Heritage",
    category: "Recommendations",
    description:
      "Finds sites sharing class, district, heritage type, or dynasty with the source site.",
    params: [["id", "string", "Source site ID."]],
  },
  "/api/v1/sites/nearby": {
    title: "Nearby Heritage",
    category: "Geospatial",
    description:
      "Ranks sites by distance from latitude and longitude using stored coordinates.",
    query: [
      ["lat", "number", "Required latitude."],
      ["lng", "number", "Required longitude."],
      ["radiusKm", "number", "Optional radius in kilometers."],
    ],
  },
  "/api/v1/caves": {
    title: "List Caves",
    category: "Entity Collections",
    description:
      "Returns sites where the database h_type field classifies the record as cave.",
    query: [["district", "string", "Optional district filter."]],
  },
  "/api/v1/forts": {
    title: "List Forts",
    category: "Entity Collections",
    description:
      "Returns sites where the database h_type field classifies the record as fort.",
    query: [["district", "string", "Optional district filter."]],
  },
  "/api/v1/inscriptions": {
    title: "List Inscriptions",
    category: "Inscriptions",
    description:
      "Flattens embedded site inscriptions into a paginated, filterable collection.",
    query: [
      ["site_name", "string", "Filter by parent site name."],
      ["site_id", "string", "Filter by parent site ID."],
      ["language", "string", "Filter by detected language."],
      ["q", "string", "Search description, script, language, translation."],
    ],
  },
  "/api/v1/inscriptions/[id]": {
    title: "Get Inscription Detail",
    category: "Inscriptions",
    description:
      "Finds an embedded inscription by either Inscription_id or inscription_id.",
    params: [["id", "string", "Inscription ID, for example Insc_01."]],
  },
  "/api/v1/facets": {
    title: "Schema Facets",
    category: "Metadata",
    description:
      "Returns searchable fields, filters, and relationships inferred from the Site collection.",
  },
  "/api/v1/timeline": {
    title: "Heritage Timeline",
    category: "Metadata",
    description:
      "Returns period and approximate-date metadata grouped with site summaries.",
  },
  "/api/v1/recommendations": {
    title: "Recommendation Feed",
    category: "Recommendations",
    description:
      "Generates related site recommendations from source site, district, heritage type, or text query.",
    query: [
      ["site_id", "string", "Optional source site."],
      ["district", "string", "Optional district hint."],
      ["heritage_type", "string", "Optional type hint."],
    ],
  },
  "/api/v1/ai/search": {
    title: "AI-Ready Search",
    category: "AI Agents",
    description:
      "Returns ranked site context snippets and follow-up API calls for RAG or agent workflows.",
    query: [["query", "string", "Required agent search query."]],
  },
};

function serialize(value) {
  return JSON.parse(JSON.stringify(value));
}

async function walkRoutes(dir = API_ROOT) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const routes = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...(await walkRoutes(fullPath)));
    } else if (entry.name === "route.js") {
      const source = await fs.readFile(fullPath, "utf8");
      const relative = path.relative(API_ROOT, path.dirname(fullPath));
      const routePath = `/api/v1/${relative.replaceAll(path.sep, "/")}`;
      routes.push({
        path: routePath,
        methods: [...source.matchAll(/export\s+(?:async\s+function|const)\s+(GET|POST|PUT|DELETE|PATCH)/g)].map(
          (match) => match[1]
        ),
      });
    }
  }

  return routes.sort((a, b) => a.path.localeCompare(b.path));
}

function parameterize(routePath, sample) {
  const siteId = sample?.site?.site_id || "Aja0003";
  const inscription = sample?.inscriptionId || "Insc_01";
  return routePath
    .replace("[id]", routePath.includes("inscriptions/[id]") ? inscription : siteId);
}

function withExampleQuery(routePath, sample) {
  if (routePath === "/api/v1/sites") return `${routePath}?district=${encodeURIComponent(sample?.site?.district || "Chhatrapati Sambhaji Nagar")}&limit=5`;
  if (routePath === "/api/v1/sites/search") return `${routePath}?q=${encodeURIComponent(sample?.site?.site_name?.split(" ")[1] || "Ajanta")}`;
  if (routePath === "/api/v1/sites/nearby") return `${routePath}?lat=${sample?.coordinates?.latitude || 20.5519}&lng=${sample?.coordinates?.longitude || 75.7033}&radiusKm=200`;
  if (routePath === "/api/v1/caves") return `${routePath}?limit=5`;
  if (routePath === "/api/v1/forts") return `${routePath}?limit=5`;
  if (routePath === "/api/v1/inscriptions") return `${routePath}?site_id=${sample?.site?.site_id || "Aja0003"}`;
  if (routePath === "/api/v1/recommendations") return `${routePath}?site_id=${sample?.site?.site_id || "Aja0003"}`;
  if (routePath === "/api/v1/ai/search") return `${routePath}?query=${encodeURIComponent(sample?.site?.heritage_type || "Buddhist cave")}`;
  return routePath;
}

async function getSample() {
  const site = await Site.findOne({ site_id: "Aja0003" }).lean();
  const fallback = site || (await Site.findOne().lean());
  const inscriptionSite =
    (await Site.findOne({ "inscriptions.0": { $exists: true } }).lean()) ||
    fallback;
  const inscription = inscriptionSite?.inscriptions?.[0];

  return {
    site: fallback ? siteSummary(fallback) : null,
    coordinates: fallback?.location || null,
    inscriptionId: inscription ? inscriptionId(inscription) : null,
    examples: {
      site: fallback ? serialize(fallback) : null,
      inscription: inscription
        ? serialize({
            ...inscription,
            inscription_id: inscriptionId(inscription),
            site_id: inscriptionSite.site_id,
            site_name: inscriptionSite.site_name,
          })
        : null,
    },
  };
}

export async function buildApiDocsData() {
  let facets = null;
  let sample = null;

  try {
    await connectDB();
    facets = await getFacets();
    sample = await getSample();
  } catch (error) {
    facets = {
      entities: ["sites", "caves", "forts", "inscriptions", "gallery"],
      searchable_fields: [],
      filters: {},
      relationships: [],
    };
    sample = { site: null, examples: {} };
  }

  const discoveredRoutes = await walkRoutes();
  const endpoints = discoveredRoutes
    .filter((route) => route.methods.includes("GET"))
    .map((route) => {
      const meta = ENDPOINT_META[route.path] || {
        title: route.path,
        category: "Discovered",
        description: "Discovered from an App Router route handler.",
      };
      const examplePath = withExampleQuery(parameterize(route.path, sample), sample);

      return {
        id: route.path.replaceAll("/", "-").replace(/^-/, ""),
        method: "GET",
        path: route.path,
        examplePath,
        curl: `curl -X GET '${examplePath}' \\\n  -H 'Authorization: ApiKey YOUR_API_KEY'`,
        ...meta,
      };
    });

  return {
    baseUrl: "/api/v1",
    generatedAt: new Date().toISOString(),
    facets,
    sample,
    endpoints,
    categories: [...new Set(endpoints.map((endpoint) => endpoint.category))],
  };
}
