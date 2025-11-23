import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import Loading from "../../loading";
// Lazy-load CaveClient for better performance
const CaveClient = dynamic(() => import("../CaveClient"), {
  loading: () => <Loading to="Cave" />,
});

async function fetchSite(id) {
  try {
    // Construct the absolute URL for server-side fetch

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/sites/${id}`,
      {
        cache: "no-store",
      }
    );
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
  const { id } = await params;
  const site = await fetchSite(id);

  if (!site) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-2xl font-bold text-gray-500 bg-green-50">
        Failed to load site
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading to={site.site_name} />}>
      <CaveClient site={site} />
    </Suspense>
  );
}
