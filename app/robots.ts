import type { MetadataRoute } from "next";

const SITE_URL = "https://lernwerkfabrik.de";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/learn/", "/login", "/logout", "/onboarding/", "/signup"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
