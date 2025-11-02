"use client";

import { useEffect, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import Loading from "../../loading";

// ✅ Lazy-load CaveClient (faster initial page load)
const CaveClient = dynamic(() => import("../CaveClient"), {
  loading: () => <Loading />,
});

export default function CavePage({ params }) {
  const { id } = params; // no await needed
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSite = async () => {
      try {
        const response = await fetch(`/api/sites/${id}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to fetch site data");
        const data = await response.json();
        setSite(data);
      } catch (error) {
        console.error("❌ Error fetching site:", error);
        setSite(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSite();
  }, [id]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-2xl font-bold text-gray-500">
        Site not found
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <CaveClient site={site} />
    </Suspense>
  );
}
