import React from "react";
import DynamicPage from "@/components/DynamicRenderer/DynamicPage";

/**
 * Universal dynamic route for rendering any heritage item (cave, fort, inscription, etc.)
 */
export default async function HeritageItemPage({ params }) {
  const { id } = await params;

  // We fetch data directly on the server component
  // Using an absolute URL if needed, or hitting the DB directly if we are in server context
  // Here we assume hitting our internal GET api or querying DB directly
  // For safety and since we are in a server component, we could import the model and query directly.
  
  let data = null;
  try {
    // We dynamically import the db connection to ensure it's loaded
    const dbConnect = (await import("@/lib/dbConnect")).default;
    await dbConnect();
    
    const Site = (await import("@/models/Site")).default;
    
    // Attempt to find the site
    // Use lean() to get a plain JS object instead of a mongoose document
    const siteDoc = await Site.findOne({ site_id: id }).lean();
    
    if (siteDoc) {
       // Convert ObjectIDs to strings so they can be passed to client components safely
       data = JSON.parse(JSON.stringify(siteDoc));
    }
  } catch (err) {
    console.error("Error fetching heritage site:", err);
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Not Found</h2>
          <p className="text-gray-400">The requested heritage item could not be found.</p>
        </div>
      </div>
    );
  }

  return <DynamicPage data={data} />;
}
