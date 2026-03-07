// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import "./globals.css";
import "katex/dist/katex.min.css";

import BrandHeader from "./BrandHeader";
import MobilePlatformHead from "./MobilePlatformHead";
import RouteAwareFooter from "./RouteAwareFooter";
import ScrollRestoration, { ScrollRestorationHead } from "./ScrollRestoration";
import { normalizeTheme, THEME_STORAGE_KEY } from "./theme-config";
import { ThemeProvider } from "./theme-provider";

import DevTierSwitcher from "@/components/DevTierSwitcher";
import { getSession } from "@/lib/auth";

const seoTitle = "LernWerkFabrik | AP1/AP2 Lernplattform fuer Industriemechaniker";
const seoDescription =
  "LernWerkFabrik geht bald live. Sichere dir Early Access, trainiere pruefungsnah fuer AP1/AP2 und starte mit klarer Struktur.";

export const metadata: Metadata = {
  metadataBase: new URL("https://lernwerkfabrik.de"),
  title: seoTitle,
  description: seoDescription,
  icons: {
    icon: [
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const sessionRes = await getSession({
    cookies: {
      get: (name: string) => cookieStore.get(name),
    },
  });

  const authed = !!(sessionRes.ok && sessionRes.data);
  const initialTheme = normalizeTheme(cookieStore.get(THEME_STORAGE_KEY)?.value);

  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`min-h-svh overflow-x-hidden md:h-dvh md:overflow-hidden${initialTheme === "dark" ? " dark" : ""}`}
    >
      <head>
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
              <BrandHeader authed={authed} />
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
