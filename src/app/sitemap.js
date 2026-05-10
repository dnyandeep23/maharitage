import connectDB from "@/lib/mongoose";
import Site from "@/models/Site";

const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://maharitage.vercel.app").replace(/\/$/, "");

const staticRoutes = [
  { url: "", priority: 1, changeFrequency: "weekly" },
  { url: "/about", priority: 0.7, changeFrequency: "monthly" },
  { url: "/search", priority: 0.8, changeFrequency: "weekly" },
  { url: "/ai", priority: 0.7, changeFrequency: "weekly" },
  { url: "/docs", priority: 0.6, changeFrequency: "monthly" },
  { url: "/login", priority: 0.3, changeFrequency: "yearly" },
  { url: "/register", priority: 0.3, changeFrequency: "yearly" },
  { url: "/privacy-policy", priority: 0.2, changeFrequency: "yearly" },
  { url: "/terms-and-conditions", priority: 0.2, changeFrequency: "yearly" },
];

export default async function sitemap() {
  const now = new Date();
  let heritageRoutes = [];

  try {
    await connectDB();
    const sites = await Site.find({}, "site_id h_type heritage_type updatedAt createdAt").lean();

    heritageRoutes = sites.flatMap((site) => {
      const lastModified = site.updatedAt || site.createdAt || now;
      const type = String(site.h_type || site.heritage_type || "").toLowerCase();
      const priority = type.includes("fort") || type.includes("cave") ? 0.9 : 0.82;

      return [
        {
          url: `${baseUrl}/heritage/${site.site_id}`,
          lastModified,
          changeFrequency: "monthly",
          priority,
        },
      ];
    });
  } catch (error) {
    console.error("Sitemap heritage route generation failed:", error);
  }

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route.url}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...heritageRoutes,
  ];
}
