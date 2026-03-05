import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  images: {
    unoptimized: true,
  },
  pageExtensions: ["static.tsx", "static.ts", "static.jsx", "static.js"],
};

export default nextConfig;
