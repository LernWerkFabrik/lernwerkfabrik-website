// app/layout.tsx
import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";

import "./globals.css";
import "katex/dist/katex.min.css";

import BrandHeader from "./BrandHeader";
import RouteAwareFooter from "./RouteAwareFooter";
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

  return (
    <html lang="de" suppressHydrationWarning className="h-dvh overflow-hidden">
      <body className="h-dvh overflow-hidden bg-background text-foreground antialiased lp-bg">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div aria-hidden="true" className="lp-bg-3d pointer-events-none fixed inset-0 -z-10" />

          <div className="flex h-full flex-col">
            <div className="shrink-0">
              <BrandHeader authed={authed} />
            </div>

            <main
              data-scroll-root
              className="relative isolate z-0 flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
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
