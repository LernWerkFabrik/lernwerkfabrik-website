import type { NextConfig } from "next";

const useStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  output: useStaticExport ? "export" : undefined,
  images: {
    unoptimized: true,
  },
  pageExtensions: ["static.tsx", "static.ts", "static.jsx", "static.js"],
};

export default nextConfig;
