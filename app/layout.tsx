import type { Metadata, Viewport } from "next";

import "./globals.css";
import "katex/dist/katex.min.css";

import BrandHeader from "./BrandHeader";
import MobilePlatformHead from "./MobilePlatformHead";
import RouteAwareFooter from "./RouteAwareFooter";
import ScrollRestoration, { ScrollRestorationHead } from "./ScrollRestoration";
import { THEME_HEAD_SCRIPT, THEME_STORAGE_KEY } from "./theme-config";
import { ThemeProvider } from "./theme-provider";

import DevTierSwitcher from "@/components/DevTierSwitcher";

const ICON_VERSION = "20260308e";
const seoTitle = "LernWerkFabrik | AP1/AP2 Prüfungsvorbereitung";
const seoDescription =
  "LernWerkFabrik geht bald live. Sichere dir Early Access, trainiere prüfungsnah für AP1/AP2 und starte mit klarer Struktur.";

export const metadata: Metadata = {
  metadataBase: new URL("https://lernwerkfabrik.de"),
  title: seoTitle,
  description: seoDescription,
  icons: {
    icon: [
      { url: `/favicon-16x16.png?v=${ICON_VERSION}`, sizes: "16x16", type: "image/png" },
      { url: `/favicon-32x32.png?v=${ICON_VERSION}`, sizes: "32x32", type: "image/png" },
      { url: `/icon.png?v=${ICON_VERSION}`, sizes: "512x512", type: "image/png" },
      { url: `/favicon.ico?v=${ICON_VERSION}`, sizes: "any" },
    ],
    apple: [{ url: `/apple-icon.png?v=${ICON_VERSION}`, sizes: "180x180", type: "image/png" }],
    shortcut: [`/favicon-32x32.png?v=${ICON_VERSION}`],
  },
  openGraph: {
    title: seoTitle,
    description: seoDescription,
    type: "website",
    locale: "de_DE",
    siteName: "LernWerkFabrik",
    images: [
      {
        url: "/brand/logo-lwf-dark.png",
        alt: "LernWerkFabrik",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoTitle,
    description: seoDescription,
    images: ["/brand/logo-lwf-dark.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "hsl(210 5% 93%)" },
    { media: "(prefers-color-scheme: dark)", color: "hsl(222 22% 6%)" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className="min-h-svh overflow-x-hidden md:h-dvh md:overflow-hidden"
    >
      <head>
        <script
          id="lwf-theme-head"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: THEME_HEAD_SCRIPT }}
        />
        <MobilePlatformHead />
        <ScrollRestorationHead />
      </head>
      <body className="min-h-svh overflow-x-hidden bg-background text-foreground antialiased lp-bg md:h-dvh md:overflow-hidden">
        <ScrollRestoration />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          storageKey={THEME_STORAGE_KEY}
        >
          <div aria-hidden="true" className="lp-bg-3d pointer-events-none fixed inset-0 -z-10" />

          <div className="flex min-h-svh flex-col md:h-full">
            <div className="h-[calc(3.5rem+env(safe-area-inset-top))] shrink-0 md:h-16">
              <BrandHeader />
            </div>

            <main
              data-scroll-root
              className="relative isolate z-0 flex-1 overflow-x-hidden md:min-h-0 md:overflow-y-auto"
            >
              {children}

              <div className="relative z-0">
                <RouteAwareFooter />
              </div>
            </main>
          </div>

          {process.env.NODE_ENV === "development" && <DevTierSwitcher />}
        </ThemeProvider>
      </body>
    </html>
  );
}
