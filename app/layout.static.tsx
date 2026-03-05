import type { Metadata, Viewport } from "next";
import Link from "next/link";

import "./globals.css";

const seoTitle = "LernWerkFabrik | Warteliste fuer AP1/AP2 Lernplattform";
const seoDescription =
  "LernWerkFabrik geht bald live. Trage dich jetzt in die Warteliste ein und sichere dir Early Access.";

export const metadata: Metadata = {
  metadataBase: new URL("https://lernwerkfabrik.de"),
  title: seoTitle,
  description: seoDescription,
  openGraph: {
    title: seoTitle,
    description: seoDescription,
    type: "website",
    locale: "de_DE",
    siteName: "LernWerkFabrik",
    images: [{ url: "/brand/logo-lwf-dark.png", alt: "LernWerkFabrik" }],
  },
  twitter: {
    card: "summary_large_image",
    title: seoTitle,
    description: seoDescription,
    images: ["/brand/logo-lwf-dark.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 md:px-6 md:py-8">
          <header className="mb-8 flex items-center justify-between rounded-2xl border border-white/15 bg-slate-900/70 px-4 py-3 backdrop-blur">
            <Link href="/" className="text-base font-semibold tracking-tight">
              LernWerkFabrik
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-300">
              <Link href="/impressum" className="hover:text-white">
                Impressum
              </Link>
              <Link href="/datenschutz" className="hover:text-white">
                Datenschutz
              </Link>
            </nav>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="mt-10 border-t border-white/15 pt-4 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/impressum" className="hover:text-white">
                Impressum
              </Link>
              <Link href="/datenschutz" className="hover:text-white">
                Datenschutz
              </Link>
              <span>© {new Date().getFullYear()} LernWerkFabrik</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
