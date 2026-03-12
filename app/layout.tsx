import type { Metadata, Viewport } from "next";

import "./globals.css";
import "katex/dist/katex.min.css";

import BrandHeader from "./BrandHeader";
import MobilePlatformHead from "./MobilePlatformHead";
import PostHogPublicEnvScript from "./PostHogPublicEnvScript";
import RouteAwareFooter from "./RouteAwareFooter";
import ScrollRestoration, { ScrollRestorationHead } from "./ScrollRestoration";
import { THEME_HEAD_SCRIPT, THEME_STORAGE_KEY } from "./theme-config";
import { ThemeProvider } from "./theme-provider";

import DevTierSwitcher from "@/components/DevTierSwitcher";
const seoTitle = "LernWerkFabrik | AP1/AP2 Prüfungsvorbereitung";
const seoDescription =
  "LernWerkFabrik geht bald live. Sichere dir Early Access, trainiere prüfungsnah für AP1/AP2 und starte mit klarer Struktur.";

export const metadata: Metadata = {
  metadataBase: new URL("https://lernwerkfabrik.de"),
  title: seoTitle,
  description: seoDescription,
  alternates: {
    canonical: "./",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: seoTitle,
    description: seoDescription,
    url: "https://lernwerkfabrik.de",
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
        <PostHogPublicEnvScript />
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
