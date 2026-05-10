const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://maharitage.vercel.app").replace(/\/$/, "");

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/heritage/", "/search", "/about", "/docs", "/ai"],
        disallow: ["/dashboard", "/api/", "/reset-password", "/verify-email"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
