import type { Metadata, Viewport } from "next";

import "./globals.css";
import "katex/dist/katex.min.css";

import BrandHeader from "./BrandHeader";
import RouteAwareFooter from "./RouteAwareFooter";
import { THEME_STORAGE_KEY } from "./theme-config";
import { ThemeProvider } from "./theme-provider";

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
    <html
      lang="de"
      suppressHydrationWarning
      className="dark min-h-svh overflow-x-hidden md:h-dvh md:overflow-hidden"
    >
      <body className="min-h-svh overflow-x-hidden bg-background text-foreground antialiased lp-bg md:h-dvh md:overflow-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
          storageKey={THEME_STORAGE_KEY}
        >
          <div aria-hidden="true" className="lp-bg-3d pointer-events-none fixed inset-0 -z-10" />

          <div className="flex min-h-svh flex-col md:h-full">
            <div className="shrink-0">
              <BrandHeader authed={false} />
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
        </ThemeProvider>
      </body>
    </html>
  );
}
