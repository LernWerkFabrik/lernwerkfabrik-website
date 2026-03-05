import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  pageExtensions: ["static.tsx", "static.ts", "static.jsx", "static.js"],
};

export default nextConfig;
