"use client";

import React, { useState } from "react";
import { Code, Database, Key, Globe, Search } from "lucide-react";
import Header from "../component/Header";
import Footer from "../component/Footer";
import ApiPlayground from "../component/ApiPlayground";

const ApiDocs = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState("getAllSites");

  const endpoints = {
    getAllSites: {
      title: "List All Heritage Sites",
      method: "GET",
      path: "/api/v1/sites",
      description:
        "Retrieve a list of all heritage sites in Maharashtra. Returns a summary for each site.",
      parameters: [],
      requestExample: `curl -X GET \
  '/api/v1/sites' \
  -H 'Authorization: ApiKey YOUR_API_KEY'`,
      responseExample: `[
  {
    "site_id": "MH-AUR-001",
    "site_name": "Ajanta Caves",
    "district": "Aurangabad",
    "heritage_type": "Cave Temple",
    "period": "2nd Century BCE to 6th Century CE"
  },
  {
    "site_id": "MH-PUN-001",
    "site_name": "Shaniwar Wada",
    "district": "Pune",
    "heritage_type": "Fortification",
    "period": "18th Century"
  }
]`,
    },
    getSiteById: {
      title: "Get Site Details",
      method: "GET",
      path: "/api/v1/sites/MH-AUR-001",
      description:
        "Retrieve detailed information for a single heritage site, including its image gallery.",
      parameters: [
        {
          name: "{id}",
          type: "string",
          description: "The unique site_id of the heritage site.",
        },
      ],
      requestExample: `curl -X GET \
  '/api/v1/sites/MH-AUR-001' \
  -H 'Authorization: ApiKey YOUR_API_KEY'`,
      responseExample: `{
  "site_name": "Ajanta Caves",
  "location": {
    "latitude": 20.5517,
    "longitude": 75.7034,
    "district": "Aurangabad",
    "state": "Maharashtra",
    "country": "India"
  },
  "heritage_type": "Cave Temple",
  "site_discription": "A series of 30 rock-cut Buddhist cave monuments...",
  "period": "2nd Century BCE to 6th Century CE",
  "historical_context": {
    "ruler_or_dynasty": "Satavahana, Vakataka",
    "approx_date": "200 BCE - 600 CE"
  },
  "verification_authority": { "curated_by": ["ASI", "UNESCO"] },
  "gallary": [
    "https://res.cloudinary.com/maharitage/image/upload/v1/sites/ajanta_cave_01.jpg",
    "https://res.cloudinary.com/maharitage/image/upload/v1/sites/ajanta_cave_02.jpg"
  ]
}`,
    },
    getinscriptionsForSite: {
      title: "List Site inscriptions",
      method: "GET",
      path: "/api/v1/sites/MH-AUR-001/inscriptions",
      description:
        "Lists all inscriptions linked to a specific heritage site. Returns a summary for each inscription.",
      parameters: [
        {
          name: "{id}",
          type: "string",
          description: "The unique site_id of the heritage site.",
        },
      ],
      requestExample: `curl -X GET \
  '/api/v1/sites/MH-AUR-001/inscriptions' \
  -H 'Authorization: ApiKey YOUR_API_KEY'`,
      responseExample: `[
  {
    "inscription_id": "INS-AUR-001-01",
    "language_detected": "Prakrit",
    "discription": "Donation record by a royal minister."
  },
  {
    "inscription_id": "INS-AUR-001-02",
    "language_detected": "Sanskrit",
    "discription": "Poetic eulogy of a Buddhist monk."
  }
]`,
    },
    getInscriptionById: {
      title: "Get Inscription Details",
      method: "GET",
      path: "/api/v1/inscriptions/INS-AUR-001-01",
      description:
        "Retrieve detailed information for a single inscription, including images and translations.",
      parameters: [
        {
          name: "{id}",
          type: "string",
          description: "The unique inscription_id of the inscription.",
        },
      ],
      requestExample: `curl -X GET \
  '/api/v1/inscriptions/INS-AUR-001-01' \
  -H 'Authorization: ApiKey YOUR_API_KEY'`,
      responseExample: `{
  "inscription_id": "INS-AUR-001-01",
  "image_urls": ["https://res.cloudinary.com/maharitage/image/upload/v1/inscriptions/aur_001_insc_01.jpg"],
  "discription": "Donation record by a royal minister.",
  "original_script": "Brahmi",
  "language_detected": "Prakrit",
  "translations": {
    "english": "This cave was excavated by the minister Varahadeva...",
    "hindi": "यह गुफा मंत्री वराहदेव द्वारा खोदी गई थी..."
  }
}`,
    },
    getAllinscriptions: {
      title: "List All inscriptions",
      method: "GET",
      path: "/api/v1/inscriptions?site_name=Ajanta%20Caves",
      description:
        "Retrieve a list of all inscriptions across all heritage sites, or filter by a specific site name. Each inscription includes its associated site information.",
      parameters: [
        {
          name: "site_name",
          type: "string",
          description:
            "Optional: Filter inscriptions by the name of the heritage site.",
        },
      ],
      requestExample: `// Get all inscriptions
curl -X GET \
  '/api/v1/inscriptions' \
  -H 'Authorization: ApiKey YOUR_API_KEY'

// Get inscriptions from 'Ajanta Caves'
curl -X GET \
  '/api/v1/inscriptions?site_name=Ajanta%20Caves' \
  -H 'Authorization: ApiKey YOUR_API_KEY'`,
      responseExample: `// Response for /api/v1/inscriptions?site_name=Ajanta Caves
[
  {
    "inscription_id": "INS-AUR-001-01",
    "discription": "Donation record by a royal minister.",
    "site_id": "MH-AUR-001",
    "site_name": "Ajanta Caves"
  },
  {
    "inscription_id": "INS-AUR-001-02",
    "discription": "Poetic eulogy of a Buddhist monk.",
    "site_id": "MH-AUR-001",
    "site_name": "Ajanta Caves"
  }
]

// Response for /api/v1/inscriptions (all inscriptions) would include entries from all sites.`,
    },
    searchSites: {
      title: "Search Sites",
      method: "GET",
      path: "/api/v1/sites/search?q=Ajanta",
      description:
        "Search for heritage sites by keyword. The search covers name, description, period, district, and dynasty.",
      parameters: [
        {
          name: "q",
          type: "string",
          description: "The keyword or phrase to search for.",
        },
      ],
      requestExample: `curl -X GET \
  '/api/v1/sites/search?q=Ajanta' \
  -H 'Authorization: ApiKey YOUR_API_KEY'`,
      responseExample: `[
  {
    "site_id": "MH-AUR-001",
    "site_name": "Ajanta Caves",
    "district": "Aurangabad",
    "heritage_type": "Cave Temple",
    "period": "2nd Century BCE to 6th Century CE"
  }
]`,
    },
  };

  return (
    <div className="archive-page text-stone-900">
      <Header currentPath="/docs" theme="light" />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="archive-kicker">Developer archive</p>
          <h1 className="archive-title mt-4 text-4xl sm:text-6xl">
            Heritage Data API
          </h1>
          <p className="archive-copy mx-auto mt-6 max-w-2xl">
            Integrate Maharashtra's heritage records, inscriptions, galleries,
            search, and site metadata into research tools and cultural products.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-cinzel-decorative text-3xl font-bold text-[#263a2d] mb-8">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Key className="w-6 h-6 text-[#8f7244]" />,
                title: "1. Get API Key",
                desc: "Generate your personal API key from the dashboard.",
              },
              {
                icon: <Code className="w-6 h-6 text-[#8f7244]" />,
                title: "2. Make a Request",
                desc: "Use our interactive playground or your own tools to call the API.",
              },
              {
                icon: <Database className="w-6 h-6 text-[#8f7244]" />,
                title: "3. Get Data",
                desc: "Receive structured JSON data ready for your application.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="museum-card p-6 transition hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-[#263a2d]/8 rounded-lg flex items-center justify-center mb-3">
                  {item.icon}
                </div>
                <h3 className="font-cinzel-decorative text-xl font-bold text-[#263a2d] mb-2">{item.title}</h3>
                <p className="text-stone-600 leading-7">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="museum-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-[#8f7244]" />
              <h3 className="font-cinzel-decorative text-xl font-bold text-[#263a2d]">Base URL</h3>
            </div>
            <code className="block bg-[#101b15] text-[#f7f0e4] p-4 rounded-md text-sm">
              /api/v1
            </code>
            <p className="mt-2 text-sm text-stone-500">
              All endpoints are relative to your current domain.
            </p>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-cinzel-decorative text-3xl font-bold text-[#263a2d] mb-6">Authentication</h2>
          <div className="museum-card p-6">
            <h3 className="font-cinzel-decorative text-xl font-bold text-[#263a2d] mb-2">API Key</h3>
            <p className="text-stone-600 leading-7 mb-4">
              To access the API, you need to include an API key in your request
              headers. You can generate a new key from your dashboard. The test
              key is rate-limited.
            </p>
            <code className="block bg-[#101b15] text-[#f7f0e4] p-4 rounded-md text-sm">
              Authorization: ApiKey YOUR_API_KEY
            </code>
            <p className="mt-4 text-sm text-stone-500">
              All API requests must be made over HTTPS. Calls made over plain
              HTTP will fail.
            </p>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-cinzel-decorative text-3xl font-bold text-[#263a2d] mb-8">API Endpoints</h2>

          {/* Tabs */}
          <div className="archive-scroll flex gap-2 overflow-x-auto whitespace-nowrap border-b border-[#263a2d]/12 pb-3">
            {Object.entries(endpoints).map(([key, endpoint]) => (
              <button
                key={key}
                className={`rounded-full px-4 py-2 font-bold text-sm ${
                  selectedEndpoint === key
                    ? "bg-[#263a2d] text-[#f7f0e4]"
                    : "bg-[#f7f0e4]/70 text-stone-500 hover:text-[#263a2d]"
                }`}
                onClick={() => setSelectedEndpoint(key)}
              >
                {endpoint.method}{" "}
                {endpoint.path.split("?")[0].substring(0, 20)}
                {endpoint.path.length > 20 ? "..." : ""}
              </button>
            ))}
          </div>

          {/* Endpoint Details */}
          <div className="mt-6">
            {Object.entries(endpoints).map(
              ([key, endpoint]) =>
                selectedEndpoint === key && (
                  <div
                    key={key}
                    className="museum-card p-6 space-y-6"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-[#263a2d]/10 text-[#263a2d]"
                        >
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-bold text-stone-800">
                          {endpoint.path}
                        </code>
                      </div>
                      <h3 className="font-cinzel-decorative text-2xl font-bold text-[#263a2d] mb-1">
                        {endpoint.title}
                      </h3>
                      <p className="text-stone-600 leading-7">{endpoint.description}</p>
                    </div>

                    {endpoint.parameters.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Parameters</h4>
                        <div className="space-y-2">
                          {endpoint.parameters.map((param, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 text-sm items-center"
                            >
                              <code className="font-mono text-[#263a2d] bg-[#263a2d]/8 px-2 py-1 rounded">
                                {param.name}
                              </code>
                              <span className="px-2 py-0.5 border rounded text-stone-700 text-xs">
                                {param.type}
                              </span>
                              <span className="text-stone-600">
                                - {param.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-3">
                        Request Example (cURL)
                      </h4>
                      <pre className="bg-[#101b15] text-[#f7f0e4] p-4 rounded-md text-sm overflow-x-auto">
                        <code>{endpoint.requestExample}</code>
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Response Example</h4>
                      <pre className="bg-[#101b15] text-[#f7f0e4] p-4 rounded-md text-sm overflow-x-auto">
                        <code>{endpoint.responseExample}</code>
                      </pre>
                    </div>
                    <ApiPlayground endpoint={endpoint} />
                  </div>
                )
            )}
          </div>
        </div>
      </section>

      {/* Response Codes */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-cinzel-decorative text-3xl font-bold text-[#263a2d] mb-6">Response Codes</h2>
          <div className="museum-card p-6 space-y-3">
            {[
              {
                code: 200,
                color: "bg-[#566044]",
                text: "Success - Request completed successfully.",
              },
              {
                code: 400,
                color: "bg-yellow-500",
                text: "Bad Request - Your request is invalid.",
              },
              {
                code: 401,
                color: "bg-red-500",
                text: "Unauthorized - Your API key is wrong.",
              },
              {
                code: 404,
                color: "bg-gray-500",
                text: "Not Found - The specified resource was not found.",
              },
              {
                code: 500,
                color: "bg-red-700",
                text: "Server Error - We had a problem with our server. Try again later.",
              },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-4">
                <span
                  className={`w-16 text-center px-2 py-1 rounded text-white text-xs font-bold ${r.color}`}
                >
                  {r.code}
                </span>
                <span>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ApiDocs;
