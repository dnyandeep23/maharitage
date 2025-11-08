"use client";

import React, { useState } from "react";
import { Code, Database, Key, Globe, Search } from "lucide-react";
import Header from "../component/Header";
import Footer from "../component/Footer";

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
  -H 'X-API-Key: MAHARITAGE_TEST_KEY'`,
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
      path: "/api/v1/sites/{id}",
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
  -H 'X-API-Key: MAHARITAGE_TEST_KEY'`,
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
  "Site_discription": "A series of 30 rock-cut Buddhist cave monuments...",
  "period": "2nd Century BCE to 6th Century CE",
  "historical_context": {
    "ruler_or_dynasty": "Satavahana, Vakataka",
    "approx_date": "200 BCE - 600 CE"
  },
  "verification_authority": { "curated_by": ["ASI", "UNESCO"] },
  "Gallary": [
    "https://res.cloudinary.com/maharitage/image/upload/v1/sites/ajanta_cave_01.jpg",
    "https://res.cloudinary.com/maharitage/image/upload/v1/sites/ajanta_cave_02.jpg"
  ]
}`,
    },
    getInscriptionsForSite: {
      title: "List Site Inscriptions",
      method: "GET",
      path: "/api/v1/sites/{id}/inscriptions",
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
  -H 'X-API-Key: MAHARITAGE_TEST_KEY'`,
      responseExample: `[
  {
    "Inscription_id": "INS-AUR-001-01",
    "language_detected": "Prakrit",
    "discription": "Donation record by a royal minister."
  },
  {
    "Inscription_id": "INS-AUR-001-02",
    "language_detected": "Sanskrit",
    "discription": "Poetic eulogy of a Buddhist monk."
  }
]`,
    },
    getInscriptionById: {
      title: "Get Inscription Details",
      method: "GET",
      path: "/api/v1/inscriptions/{id}",
      description:
        "Retrieve detailed information for a single inscription, including images and translations.",
      parameters: [
        {
          name: "{id}",
          type: "string",
          description: "The unique Inscription_id of the inscription.",
        },
      ],
      requestExample: `curl -X GET \
  '/api/v1/inscriptions/INS-AUR-001-01' \
  -H 'X-API-Key: MAHARITAGE_TEST_KEY'`,
      responseExample: `{
  "Inscription_id": "INS-AUR-001-01",
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
    getAllInscriptions: {
      title: "List All Inscriptions",
      method: "GET",
      path: "/api/v1/inscriptions?site_name={site_name}",
      description:
        "Retrieve a list of all inscriptions across all heritage sites, or filter by a specific site name. Each inscription includes its associated site information.",
      parameters: [
        {
          name: "site_name",
          type: "string",
          description: "Optional: Filter inscriptions by the name of the heritage site.",
        },
      ],
      requestExample: `// Get all inscriptions
curl -X GET \
  '/api/v1/inscriptions' \
  -H 'X-API-Key: MAHARITAGE_TEST_KEY'

// Get inscriptions from 'Ajanta Caves'
curl -X GET \
  '/api/v1/inscriptions?site_name=Ajanta Caves' \
  -H 'X-API-Key: MAHARITAGE_TEST_KEY'`,
      responseExample: `// Response for /api/v1/inscriptions?site_name=Ajanta Caves
[
  {
    "Inscription_id": "INS-AUR-001-01",
    "discription": "Donation record by a royal minister.",
    "site_id": "MH-AUR-001",
    "site_name": "Ajanta Caves"
  },
  {
    "Inscription_id": "INS-AUR-001-02",
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
      path: "/api/v1/sites/search?q={query}",
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
  -H 'X-API-Key: MAHARITAGE_TEST_KEY'`,
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 bg-gradient-to-b from-green-100 to-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold mb-6">API Documentation</h1>
          <p className="text-lg sm:text-xl text-gray-600">
            Your complete guide to integrating Maharashtra's rich heritage data
            into your applications.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{
                icon: <Key className="w-6 h-6 text-green-600" />,
                title: "1. Use Test API Key",
                desc: "Use the provided test API key to start exploring the API.",
              },
              {
                icon: <Code className="w-6 h-6 text-green-600" />,
                title: "2. Make a Request",
                desc: "Use your favorite HTTP client to make requests to our endpoints.",
              },
              {
                icon: <Database className="w-6 h-6 text-green-600" />,
                title: "3. Get Data",
                desc: "Receive structured JSON data ready for your application.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-6 bg-white rounded-2xl shadow-md hover:shadow-lg transition"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4 sm:px-6 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-5 h-5 text-green-600" />
              <h3 className="text-xl font-semibold">Base URL</h3>
            </div>
            <code className="block bg-gray-200 p-4 rounded-md text-sm">
              /api/v1
            </code>
            <p className="mt-2 text-sm text-gray-500">
              All endpoints are relative to your current domain.
            </p>
          </div>
        </div>
      </section>

      {/* Authentication */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Authentication</h2>
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <h3 className="text-xl font-semibold mb-2">Public Test API Key</h3>
            <p className="text-gray-600 mb-4">
              For testing and demonstration purposes, you can use the public
              test API key. Include it in the request header as follows:
            </p>
            <code className="block bg-gray-200 p-4 rounded-md text-sm">
              X-API-Key: MAHARITAGE_TEST_KEY
            </code>
            <p className="mt-4 text-sm text-gray-500">
              All API requests must be made over HTTPS. Calls made over plain
              HTTP will fail.
            </p>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-12 px-4 sm:px-6 bg-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">API Endpoints</h2>

          {/* Tabs */}
          <div className="flex border-b overflow-x-auto whitespace-nowrap">
            {Object.entries(endpoints).map(([key, endpoint]) => (
              <button
                key={key}
                className={`px-4 py-2 font-medium text-sm -mb-px ${
                  selectedEndpoint === key
                    ? "border-b-2 border-green-600 text-green-600"
                    : "text-gray-500 hover:text-green-600"
                }`}
                onClick={() => setSelectedEndpoint(key)}
              >
                {endpoint.method} {endpoint.path.split("?")[0].substring(0, 20)}
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
                    className="bg-white p-6 rounded-2xl shadow-md space-y-6"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase ${"bg-green-100 text-green-800"}`}
                        >
                          {endpoint.method}
                        </span>
                        <code className="text-sm font-bold text-gray-800">
                          {endpoint.path}
                        </code>
                      </div>
                      <h3 className="text-2xl font-semibold mb-1">
                        {endpoint.title}
                      </h3>
                      <p className="text-gray-600">{endpoint.description}</p>
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
                              <code className="font-mono text-green-700 bg-green-50 px-2 py-1 rounded">
                                {param.name}
                              </code>
                              <span className="px-2 py-0.5 border rounded text-gray-700 text-xs">
                                {param.type}
                              </span>
                              <span className="text-gray-600">
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
                      <pre className="bg-gray-800 text-white p-4 rounded-md text-sm overflow-x-auto">
                        <code>{endpoint.requestExample}</code>
                      </pre>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Response Example</h4>
                      <pre className="bg-gray-800 text-white p-4 rounded-md text-sm overflow-x-auto">
                        <code>{endpoint.responseExample}</code>
                      </pre>
                    </div>
                  </div>
                )
            )}
          </div>
        </div>
      </section>

      {/* Response Codes */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Response Codes</h2>
          <div className="bg-white p-6 rounded-2xl shadow-md space-y-3">
            {[{
                code: 200,
                color: "bg-green-500",
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

