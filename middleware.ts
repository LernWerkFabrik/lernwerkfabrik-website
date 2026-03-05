import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ROUTES = new Set(["/", "/impressum", "/datenschutz"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const normalizedPathname =
    pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  const isAllowed =
    ALLOWED_ROUTES.has(normalizedPathname) ||
    normalizedPathname.startsWith("/_next") ||
    normalizedPathname.startsWith("/favicon") ||
    normalizedPathname.startsWith("/assets") ||
    normalizedPathname.startsWith("/images") ||
    normalizedPathname.startsWith("/public") ||
    normalizedPathname.startsWith("/brand") ||
    normalizedPathname.startsWith("/social") ||
    /\.[a-zA-Z0-9]+$/.test(normalizedPathname);

  if (!isAllowed) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
