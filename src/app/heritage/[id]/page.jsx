import React from "react";
import DynamicPage from "@/components/DynamicRenderer/DynamicPage";

/**
 * Universal dynamic route for rendering any heritage item.
 * MongoDB remains the source of truth; CaveClient handles cave/fort presentation by h_type.
 */
export default async function HeritageItemPage({ params }) {
  const { id } = await params;

  let data = null;
  try {
    const connectDB = (await import("@/lib/mongoose")).default;
    await connectDB();

    const Site = (await import("@/models/Site")).default;
    const siteDoc = await Site.findOne({ site_id: id }).lean();

    if (siteDoc) {
      data = JSON.parse(JSON.stringify(siteDoc));
    }
  } catch (err) {
    console.error("Error fetching heritage site:", err);
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea] px-6">
        <div className="max-w-md rounded-[2rem] border border-stone-200 bg-white p-8 text-center shadow-xl">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500">
            Archive record
          </p>
          <h2 className="mt-3 font-cinzel-decorative text-3xl font-bold text-stone-950">
            Not Found
          </h2>
          <p className="mt-3 text-stone-600">
            The requested heritage item could not be found in the current collection.
          </p>
        </div>
      </div>
    );
  }

  return <DynamicPage data={data} />;
}
