import CaveClient from "../CaveClient";
import Loading from "../../loading";
import { Suspense } from "react";

async function getSite(id) {
  try {
    const res = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/sites/${id}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error("Failed to fetch site:", res.statusText);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching site:", error);
    return null;
  }
}

export default async function CavePage({ params }) {
  // ✅ Await params
  const { id } = await params;

  const site = await getSite(id);

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
