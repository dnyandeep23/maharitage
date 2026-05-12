import Site from "../models/Site";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 12;
const TEXT_FIELDS = [
  "site_name",
  "site_discription",
  "period",
  "heritage_type",
  "h_type",
  "location.district",
  "location.state",
  "historical_context.ruler_or_dynasty",
  "historical_context.cultural_significance",
];

export function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getPagination(searchParams) {
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit")) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function siteSummary(site) {
  return {
    site_id: site.site_id,
    site_name: site.site_name,
    h_type: site.h_type,
    district: site.location?.district || null,
    state: site.location?.state || null,
    heritage_type: site.heritage_type,
    period: site.period || null,
    dynasty: site.historical_context?.ruler_or_dynasty || null,
    gallery_count: Array.isArray(site.gallary) ? site.gallary.length : 0,
    inscription_count: Array.isArray(site.inscriptions)
      ? site.inscriptions.length
      : 0,
  };
}

export function inscriptionId(inscription) {
  return inscription?.Inscription_id || inscription?.inscription_id || null;
}

export function inscriptionSummary(inscription, site) {
  return {
    inscription_id: inscriptionId(inscription),
    site_id: site.site_id,
    site_name: site.site_name,
    district: site.location?.district || null,
    language_detected: inscription.language_detected || null,
    original_script: inscription.original_script || null,
    discription: inscription.discription || inscription.description || null,
    image_count: Array.isArray(inscription.image_urls)
      ? inscription.image_urls.length
      : 0,
  };
}

export function buildSiteQuery(searchParams, forcedFilters = {}) {
  const query = { ...forcedFilters };
  const textQuery = searchParams.get("q") || searchParams.get("query");
  const exactFilters = [
    ["district", "location.district"],
    ["heritage_type", "heritage_type"],
    ["h_type", "h_type"],
    ["period", "period"],
    ["dynasty", "historical_context.ruler_or_dynasty"],
  ];

  exactFilters.forEach(([param, field]) => {
    const value = searchParams.get(param);
    if (value) {
      query[field] = new RegExp(escapeRegex(value), "i");
    }
  });

  if (textQuery) {
    const regex = new RegExp(escapeRegex(textQuery), "i");
    query.$or = TEXT_FIELDS.map((field) => ({ [field]: regex }));
  }

  return query;
}

export async function paginatedSites(searchParams, forcedFilters = {}) {
  const query = buildSiteQuery(searchParams, forcedFilters);
  const { page, limit, skip } = getPagination(searchParams);
  const [items, total] = await Promise.all([
    Site.find(query)
      .select(
        "site_id site_name h_type location heritage_type period historical_context gallary inscriptions"
      )
      .sort({ site_name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Site.countDocuments(query),
  ]);

  return {
    data: items.map(siteSummary),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    filters: Object.fromEntries(searchParams.entries()),
  };
}

export async function getFacets() {
  const [
    heritageTypes,
    districts,
    siteClasses,
    periods,
    dynasties,
    languages,
  ] = await Promise.all([
    Site.distinct("heritage_type"),
    Site.distinct("location.district"),
    Site.distinct("h_type"),
    Site.distinct("period"),
    Site.distinct("historical_context.ruler_or_dynasty"),
    Site.distinct("inscriptions.language_detected"),
  ]);

  return {
    entities: ["sites", "caves", "forts", "inscriptions", "gallery"],
    searchable_fields: TEXT_FIELDS,
    filters: {
      heritage_type: heritageTypes.filter(Boolean).sort(),
      district: districts.filter(Boolean).sort(),
      h_type: siteClasses.filter(Boolean).sort(),
      period: periods.filter(Boolean).sort(),
      dynasty: dynasties.filter(Boolean).sort(),
      language: languages.filter(Boolean).sort(),
    },
    relationships: [
      {
        from: "site",
        to: "inscriptions",
        type: "embedded array",
        key: "site.inscriptions[]",
      },
      {
        from: "site",
        to: "gallery",
        type: "embedded media URLs",
        key: "site.gallary[]",
      },
      {
        from: "site",
        to: "location",
        type: "embedded geographic metadata",
        key: "site.location",
      },
    ],
  };
}

export function haversineKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

export function scoreSite(site, terms = []) {
  const haystack = [
    site.site_name,
    site.site_discription,
    site.heritage_type,
    site.h_type,
    site.period,
    site.location?.district,
    site.historical_context?.ruler_or_dynasty,
    site.historical_context?.cultural_significance,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return terms.reduce(
    (score, term) => score + (haystack.includes(term.toLowerCase()) ? 1 : 0),
    0
  );
}

