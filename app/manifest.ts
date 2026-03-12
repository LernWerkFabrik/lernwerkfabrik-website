import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LernWerkFabrik",
    short_name: "LWF",
    description:
      "LernWerkFabrik geht bald live. Sichere dir Early Access, trainiere prüfungsnah für AP1/AP2 und starte mit klarer Struktur.",
    start_url: "/",
    display: "standalone",
    background_color: "#020817",
    theme_color: "#020817",
    icons: [
      {
        src: "/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
