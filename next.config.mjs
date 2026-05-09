/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["mongoose"],

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Allow any https image host for dynamic MongoDB data (uploaded images from Cloudinary etc.)
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": "./src",
    };
    return config;
  },
};

export default nextConfig;
