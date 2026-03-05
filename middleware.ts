import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ROUTES = new Set(["/", "/impressum", "/datenschutz"]);

function withCountryCookie(request: NextRequest, response: NextResponse) {
  const countryHeader = request.headers.get("cf-ipcountry")?.trim() ?? "";
  const country = /^[A-Za-z]{2}$/.test(countryHeader) ? countryHeader.toUpperCase() : "";

  if (country) {
    response.cookies.set("lw_country", country, {
      path: "/",
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalizedPathname =
    pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  const isAllowed =
    ALLOWED_ROUTES.has(normalizedPathname) ||
    normalizedPathname.startsWith("/api/waitlist") ||
    normalizedPathname.startsWith("/_next") ||
    normalizedPathname.startsWith("/favicon") ||
    normalizedPathname.startsWith("/assets") ||
    normalizedPathname.startsWith("/images") ||
    normalizedPathname.startsWith("/public") ||
    normalizedPathname.startsWith("/brand") ||
    normalizedPathname.startsWith("/social") ||
    /\.[a-zA-Z0-9]+$/.test(normalizedPathname);

  if (!isAllowed) return withCountryCookie(request, NextResponse.redirect(new URL("/", request.url)));
  return withCountryCookie(request, NextResponse.next());
}

export const config = {
  matcher: "/:path*",
};
