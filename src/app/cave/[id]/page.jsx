import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import Loading from "../../loading";
import { headers } from "next/headers";

// Lazy-load CaveClient for better performance
const CaveClient = dynamic(() => import("../CaveClient"), {
  loading: () => <Loading />,
});

async function fetchSite(id) {
  try {
    // Construct the absolute URL for server-side fetch
    const host = headers().get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const url = `${baseUrl}/api/sites/${id}`;

    const response = await fetch(url, {
      cache: "no-store", // Ensures fresh data on each request
    });

    if (!response.ok) {
      throw new Error("Failed to fetch site data");
    }
    return await response.json();
  } catch (error) {
    console.error("❌ Error fetching site:", error);
    return null; // Return null on error
  }
}

export default async function CavePage({ params }) {
  const { id } = params;
  const site = await fetchSite(id);

  if (!site) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-2xl font-bold text-gray-500 bg-green-50">
        Failed to load site
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <CaveClient site={site} />
    </Suspense>
  );
}
