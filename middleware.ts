import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ROUTES = new Set(["/", "/index", "/index.html", "/impressum", "/datenschutz"]);

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
  const effectivePath = normalizedPathname || "/";

  const isAllowed =
    ALLOWED_ROUTES.has(effectivePath) ||
    effectivePath.startsWith("/api/") ||
    effectivePath.startsWith("/_next") ||
    effectivePath.startsWith("/favicon") ||
    effectivePath.startsWith("/assets") ||
    effectivePath.startsWith("/images") ||
    effectivePath.startsWith("/public") ||
    effectivePath.startsWith("/brand") ||
    effectivePath.startsWith("/social") ||
    /\.[a-zA-Z0-9]+$/.test(effectivePath);

  if (!isAllowed) {
    // Guard against redirect loops on providers that normalize "/" differently.
    if (effectivePath === "/" || effectivePath === "/index" || effectivePath === "/index.html") {
      return withCountryCookie(request, NextResponse.next());
    }
    return withCountryCookie(request, NextResponse.redirect(new URL("/", request.url)));
  }
  return withCountryCookie(request, NextResponse.next());
}

export const config = {
  matcher: "/:path*",
};
