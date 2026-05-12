export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiCategory =
  | "AI Agents"
  | "Entity Collections"
  | "Geospatial"
  | "Heritage Sites"
  | "Inscriptions"
  | "Media"
  | "Metadata"
  | "Recommendations"
  | "Search";

export type ApiParameterLocation = "path" | "query" | "header";

export type ApiParameter = {
  name: string;
  type: "string" | "number" | "boolean";
  location: ApiParameterLocation;
  required?: boolean;
  description: string;
  example?: string | number | boolean;
};

export type ApiExample = {
  path: string;
  curl: string;
};

export type ApiResponse = {
  status: number;
  description: string;
  example?: unknown;
};

export type ApiEndpoint = {
  id: string;
  title: string;
  category: ApiCategory;
  method: ApiMethod;
  path: string;
  description: string;
  authRequired: boolean;
  tags: string[];
  parameters: ApiParameter[];
  example: ApiExample;
  responses: ApiResponse[];
};

export type ApiDocsData = {
  baseUrl: string;
  source: "static-registry";
  endpoints: ApiEndpoint[];
  categories: ApiCategory[];
  generatedAt: string | null;
};

const authHeader: ApiParameter = {
  name: "Authorization",
  type: "string",
  location: "header",
  required: true,
  description: "Use the format `ApiKey YOUR_API_KEY`.",
  example: "ApiKey YOUR_API_KEY",
};

const ok = (description: string, example?: unknown): ApiResponse => ({
  status: 200,
  description,
  example,
});

const clientErrors: ApiResponse[] = [
  {
    status: 400,
    description: "Missing or invalid request parameters.",
  },
  {
    status: 401,
    description: "API key is missing or invalid.",
  },
  {
    status: 404,
    description: "Requested resource was not found.",
  },
];

const curlFor = (path: string) =>
  `curl -X GET '${path}' \\\n  -H 'Authorization: ApiKey YOUR_API_KEY'`;

export const apiRegistry = [
  {
    id: "ai-search",
    title: "AI-Ready Search",
    category: "AI Agents",
    method: "GET",
    path: "/api/v1/ai/search",
    description:
      "Returns ranked site context snippets and follow-up API calls for RAG or agent workflows.",
    authRequired: true,
    tags: ["ai", "rag", "search"],
    parameters: [
      authHeader,
      {
        name: "query",
        type: "string",
        location: "query",
        required: true,
        description: "Agent search query.",
        example: "Buddhist cave",
      },
    ],
    example: {
      path: "/api/v1/ai/search?query=Buddhist%20cave",
      curl: curlFor("/api/v1/ai/search?query=Buddhist%20cave"),
    },
    responses: [
      ok("Ranked heritage context and suggested follow-up API calls.", {
        query: "Buddhist cave",
        results: [
          {
            site_id: "Aja0003",
            site_name: "Ajanta Caves",
            score: 0.92,
            api_calls: [
              "/api/v1/sites/Aja0003",
              "/api/v1/sites/Aja0003/gallery",
            ],
          },
        ],
      }),
      ...clientErrors,
    ],
  },
  {
    id: "caves-list",
    title: "List Caves",
    category: "Entity Collections",
    method: "GET",
    path: "/api/v1/caves",
    description:
      "Returns sites where the database h_type field classifies the record as cave.",
    authRequired: true,
    tags: ["caves", "sites"],
    parameters: [
      authHeader,
      {
        name: "district",
        type: "string",
        location: "query",
        description: "Optional district filter.",
        example: "Aurangabad",
      },
      {
        name: "limit",
        type: "number",
        location: "query",
        description: "Optional result limit.",
        example: 5,
      },
    ],
    example: {
      path: "/api/v1/caves?limit=5",
      curl: curlFor("/api/v1/caves?limit=5"),
    },
    responses: [ok("Paginated cave site summaries."), ...clientErrors],
  },
  {
    id: "facets",
    title: "Schema Facets",
    category: "Metadata",
    method: "GET",
    path: "/api/v1/facets",
    description:
      "Returns searchable fields, filters, and relationships supported by the heritage data model.",
    authRequired: true,
    tags: ["metadata", "filters"],
    parameters: [authHeader],
    example: {
      path: "/api/v1/facets",
      curl: curlFor("/api/v1/facets"),
    },
    responses: [
      ok("Available filters, searchable fields, entities, and relationships.", {
        entities: ["sites", "caves", "forts", "inscriptions", "gallery"],
        filters: {
          district: ["Aurangabad", "Pune"],
          h_type: ["cave", "fort"],
        },
      }),
      ...clientErrors,
    ],
  },
  {
    id: "forts-list",
    title: "List Forts",
    category: "Entity Collections",
    method: "GET",
    path: "/api/v1/forts",
    description:
      "Returns sites where the database h_type field classifies the record as fort.",
    authRequired: true,
    tags: ["forts", "sites"],
    parameters: [
      authHeader,
      {
        name: "district",
        type: "string",
        location: "query",
        description: "Optional district filter.",
        example: "Pune",
      },
      {
        name: "limit",
        type: "number",
        location: "query",
        description: "Optional result limit.",
        example: 5,
      },
    ],
    example: {
      path: "/api/v1/forts?limit=5",
      curl: curlFor("/api/v1/forts?limit=5"),
    },
    responses: [ok("Paginated fort site summaries."), ...clientErrors],
  },
  {
    id: "inscriptions-list",
    title: "List Inscriptions",
    category: "Inscriptions",
    method: "GET",
    path: "/api/v1/inscriptions",
    description:
      "Flattens embedded site inscriptions into a paginated, filterable collection.",
    authRequired: true,
    tags: ["inscriptions", "epigraphy"],
    parameters: [
      authHeader,
      {
        name: "site_name",
        type: "string",
        location: "query",
        description: "Filter by parent site name.",
        example: "Ajanta Caves",
      },
      {
        name: "site_id",
        type: "string",
        location: "query",
        description: "Filter by parent site ID.",
        example: "Aja0003",
      },
      {
        name: "language",
        type: "string",
        location: "query",
        description: "Filter by detected language.",
        example: "Prakrit",
      },
      {
        name: "q",
        type: "string",
        location: "query",
        description: "Search description, script, language, or translation.",
      },
    ],
    example: {
      path: "/api/v1/inscriptions?site_id=Aja0003",
      curl: curlFor("/api/v1/inscriptions?site_id=Aja0003"),
    },
    responses: [ok("Paginated inscription summaries."), ...clientErrors],
  },
  {
    id: "inscriptions-detail",
    title: "Get Inscription Detail",
    category: "Inscriptions",
    method: "GET",
    path: "/api/v1/inscriptions/[id]",
    description:
      "Finds an embedded inscription by either Inscription_id or inscription_id.",
    authRequired: true,
    tags: ["inscriptions", "detail"],
    parameters: [
      authHeader,
      {
        name: "id",
        type: "string",
        location: "path",
        required: true,
        description: "Inscription ID.",
        example: "Insc_01",
      },
    ],
    example: {
      path: "/api/v1/inscriptions/Insc_01",
      curl: curlFor("/api/v1/inscriptions/Insc_01"),
    },
    responses: [ok("Single inscription with parent site context."), ...clientErrors],
  },
  {
    id: "recommendations",
    title: "Recommendation Feed",
    category: "Recommendations",
    method: "GET",
    path: "/api/v1/recommendations",
    description:
      "Generates related site recommendations from source site, district, heritage type, or text query.",
    authRequired: true,
    tags: ["recommendations", "related"],
    parameters: [
      authHeader,
      {
        name: "site_id",
        type: "string",
        location: "query",
        description: "Optional source site.",
        example: "Aja0003",
      },
      {
        name: "district",
        type: "string",
        location: "query",
        description: "Optional district hint.",
      },
      {
        name: "heritage_type",
        type: "string",
        location: "query",
        description: "Optional heritage type hint.",
      },
    ],
    example: {
      path: "/api/v1/recommendations?site_id=Aja0003",
      curl: curlFor("/api/v1/recommendations?site_id=Aja0003"),
    },
    responses: [ok("Related heritage site summaries."), ...clientErrors],
  },
  {
    id: "sites-list",
    title: "List Heritage Sites",
    category: "Heritage Sites",
    method: "GET",
    path: "/api/v1/sites",
    description:
      "Returns paginated heritage site summaries with filters derived from site metadata.",
    authRequired: true,
    tags: ["sites", "collection"],
    parameters: [
      authHeader,
      {
        name: "q",
        type: "string",
        location: "query",
        description: "Search name, description, period, district, or dynasty.",
      },
      {
        name: "district",
        type: "string",
        location: "query",
        description: "Filter by location district.",
        example: "Chhatrapati Sambhaji Nagar",
      },
      {
        name: "heritage_type",
        type: "string",
        location: "query",
        description: "Filter by heritage classification.",
      },
      {
        name: "h_type",
        type: "string",
        location: "query",
        description: "Filter by normalized class such as cave or fort.",
      },
      {
        name: "page",
        type: "number",
        location: "query",
        description: "Page number.",
        example: 1,
      },
      {
        name: "limit",
        type: "number",
        location: "query",
        description: "Results per page, max 50.",
        example: 5,
      },
    ],
    example: {
      path: "/api/v1/sites?district=Chhatrapati%20Sambhaji%20Nagar&limit=5",
      curl: curlFor(
        "/api/v1/sites?district=Chhatrapati%20Sambhaji%20Nagar&limit=5"
      ),
    },
    responses: [ok("Paginated heritage site summaries."), ...clientErrors],
  },
  {
    id: "sites-detail",
    title: "Get Site Detail",
    category: "Heritage Sites",
    method: "GET",
    path: "/api/v1/sites/[id]",
    description:
      "Returns a full site document including location, gallery, references, and embedded inscriptions.",
    authRequired: true,
    tags: ["sites", "detail"],
    parameters: [
      authHeader,
      {
        name: "id",
        type: "string",
        location: "path",
        required: true,
        description: "Site ID.",
        example: "Aja0003",
      },
    ],
    example: {
      path: "/api/v1/sites/Aja0003",
      curl: curlFor("/api/v1/sites/Aja0003"),
    },
    responses: [ok("Single heritage site document."), ...clientErrors],
  },
  {
    id: "sites-gallery",
    title: "Get Site Gallery",
    category: "Media",
    method: "GET",
    path: "/api/v1/sites/[id]/gallery",
    description: "Returns gallery media URLs attached to a specific heritage site.",
    authRequired: true,
    tags: ["sites", "gallery", "media"],
    parameters: [
      authHeader,
      {
        name: "id",
        type: "string",
        location: "path",
        required: true,
        description: "Site ID.",
        example: "Aja0003",
      },
    ],
    example: {
      path: "/api/v1/sites/Aja0003/gallery",
      curl: curlFor("/api/v1/sites/Aja0003/gallery"),
    },
    responses: [ok("Gallery media for one site."), ...clientErrors],
  },
  {
    id: "sites-inscriptions",
    title: "List Site Inscriptions",
    category: "Inscriptions",
    method: "GET",
    path: "/api/v1/sites/[id]/inscriptions",
    description: "Returns inscription summaries embedded under a specific heritage site.",
    authRequired: true,
    tags: ["sites", "inscriptions"],
    parameters: [
      authHeader,
      {
        name: "id",
        type: "string",
        location: "path",
        required: true,
        description: "Site ID.",
        example: "Aja0003",
      },
    ],
    example: {
      path: "/api/v1/sites/Aja0003/inscriptions",
      curl: curlFor("/api/v1/sites/Aja0003/inscriptions"),
    },
    responses: [ok("Inscriptions attached to one site."), ...clientErrors],
  },
  {
    id: "sites-related",
    title: "Related Heritage",
    category: "Recommendations",
    method: "GET",
    path: "/api/v1/sites/[id]/related",
    description:
      "Finds sites sharing class, district, heritage type, or dynasty with the source site.",
    authRequired: true,
    tags: ["sites", "related"],
    parameters: [
      authHeader,
      {
        name: "id",
        type: "string",
        location: "path",
        required: true,
        description: "Source site ID.",
        example: "Aja0003",
      },
    ],
    example: {
      path: "/api/v1/sites/Aja0003/related",
      curl: curlFor("/api/v1/sites/Aja0003/related"),
    },
    responses: [ok("Related heritage site summaries."), ...clientErrors],
  },
  {
    id: "sites-nearby",
    title: "Nearby Heritage",
    category: "Geospatial",
    method: "GET",
    path: "/api/v1/sites/nearby",
    description:
      "Ranks sites by distance from latitude and longitude using stored coordinates.",
    authRequired: true,
    tags: ["sites", "map", "nearby"],
    parameters: [
      authHeader,
      {
        name: "lat",
        type: "number",
        location: "query",
        required: true,
        description: "Latitude.",
        example: 20.5519,
      },
      {
        name: "lng",
        type: "number",
        location: "query",
        required: true,
        description: "Longitude.",
        example: 75.7033,
      },
      {
        name: "radiusKm",
        type: "number",
        location: "query",
        description: "Optional radius in kilometers.",
        example: 200,
      },
    ],
    example: {
      path: "/api/v1/sites/nearby?lat=20.5519&lng=75.7033&radiusKm=200",
      curl: curlFor(
        "/api/v1/sites/nearby?lat=20.5519&lng=75.7033&radiusKm=200"
      ),
    },
    responses: [ok("Distance-ranked heritage site summaries."), ...clientErrors],
  },
  {
    id: "sites-search",
    title: "Search Sites",
    category: "Search",
    method: "GET",
    path: "/api/v1/sites/search",
    description: "Keyword search across schema-supported site fields.",
    authRequired: true,
    tags: ["sites", "search"],
    parameters: [
      authHeader,
      {
        name: "q",
        type: "string",
        location: "query",
        required: true,
        description: "Required search term.",
        example: "Ajanta",
      },
    ],
    example: {
      path: "/api/v1/sites/search?q=Ajanta",
      curl: curlFor("/api/v1/sites/search?q=Ajanta"),
    },
    responses: [ok("Matching heritage site summaries."), ...clientErrors],
  },
  {
    id: "timeline",
    title: "Heritage Timeline",
    category: "Metadata",
    method: "GET",
    path: "/api/v1/timeline",
    description:
      "Returns period and approximate-date metadata grouped with site summaries.",
    authRequired: true,
    tags: ["metadata", "timeline"],
    parameters: [authHeader],
    example: {
      path: "/api/v1/timeline",
      curl: curlFor("/api/v1/timeline"),
    },
    responses: [ok("Chronological heritage metadata."), ...clientErrors],
  },
] as const satisfies readonly ApiEndpoint[];

export const apiCategories = Array.from(
  new Set(apiRegistry.map((endpoint) => endpoint.category))
).sort((a, b) => a.localeCompare(b)) as ApiCategory[];

export function getApiDocsData(): ApiDocsData {
  return {
    baseUrl: "/api/v1",
    source: "static-registry",
    endpoints: [...apiRegistry],
    categories: apiCategories,
    generatedAt: null,
  };
}

export function getApiEndpointById(id: string): ApiEndpoint | null {
  return apiRegistry.find((endpoint) => endpoint.id === id) ?? null;
}
