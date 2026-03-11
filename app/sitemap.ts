import type { MetadataRoute } from "next";

const SITE_URL = "https://lernwerkfabrik.de";
const LAST_MODIFIED = new Date("2026-03-11T00:00:00.000Z");

const publicRoutes = [
  "/",
  "/business",
  "/cookies",
  "/datenschutz",
  "/faq",
  "/impressum",
  "/pricing",
  "/terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: LAST_MODIFIED,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.7,
  }));
}
