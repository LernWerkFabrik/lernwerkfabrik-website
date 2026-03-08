import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ROUTES = new Set(["/", "/index", "/index.html", "/impressum", "/datenschutz"]);

function getRequestProtocol(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim().toLowerCase();
  if (forwardedProto === "http" || forwardedProto === "https") return `${forwardedProto}:`;

  const cfVisitor = request.headers.get("cf-visitor");
  if (cfVisitor) {
    try {
      const parsed = JSON.parse(cfVisitor) as { scheme?: string };
      if (parsed.scheme === "http" || parsed.scheme === "https") return `${parsed.scheme}:`;
    } catch {
      // ignore malformed cf-visitor header
    }
  }

  return request.nextUrl.protocol;
}

function shouldForceHttps(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") return false;
  return getRequestProtocol(request) === "http:";
}

function withCountryCookie(request: NextRequest, response: NextResponse) {
  const countryHeader = request.headers.get("cf-ipcountry")?.trim() ?? "";
  const country = /^[A-Za-z]{2}$/.test(countryHeader) ? countryHeader.toUpperCase() : "";
  const protocol = getRequestProtocol(request);

  if (country) {
    response.cookies.set("lw_country", country, {
      path: "/",
      sameSite: "lax",
      secure: protocol === "https:",
    });
  }

  if (process.env.NODE_ENV === "production" && protocol === "https:") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  return response;
}

export function middleware(request: NextRequest) {
  if (shouldForceHttps(request)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = "https:";
    return withCountryCookie(request, NextResponse.redirect(redirectUrl, 308));
  }

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
