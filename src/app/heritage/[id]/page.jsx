import React from "react";
import DynamicPage from "@/components/DynamicRenderer/DynamicPage";

const getDescription = (site) =>
  site?.site_description || site?.site_discription || site?.description || "";

async function getSite(id) {
  try {
    const connectDB = (await import("@/lib/mongoose")).default;
    await connectDB();

    const Site = (await import("@/models/Site")).default;
    const siteDoc = await Site.findOne({ site_id: id }).lean();

    return siteDoc ? JSON.parse(JSON.stringify(siteDoc)) : null;
  } catch (err) {
    console.error("Error fetching heritage site:", err);
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const site = await getSite(id);

  if (!site) {
    return {
      title: "Heritage Record Not Found",
      description: "The requested MahaRitage archive record could not be found.",
    };
  }

  const description =
    getDescription(site)?.slice(0, 155) ||
    `Explore ${site.site_name}, a Maharashtra heritage archive record with gallery, location, period, inscriptions, architecture, and references.`;
  const image = site?.banner_image || site?.gallery?.[0] || site?.gallary?.[0] || "/home-bg.svg";

  return {
    title: `${site.site_name} | ${site.heritage_type || site.h_type || "Heritage Record"}`,
    description,
    openGraph: {
      title: `${site.site_name} | MahaRitage Archive`,
      description,
      type: "article",
      images: [{ url: image, alt: site.site_name }],
    },
  };
}

/**
 * Universal dynamic route for rendering any heritage item.
 * MongoDB remains the source of truth; CaveClient handles cave/fort presentation by h_type.
 */
export default async function HeritageItemPage({ params }) {
  const { id } = await params;
  const data = await getSite(id);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f3ea] px-6">
        <div className="museum-card max-w-md p-8 text-center">
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
