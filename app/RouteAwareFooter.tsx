"use client";

import { usePathname } from "next/navigation";

import BrandFooter from "./BrandFooter";

function shouldHideFooter(pathname: string | null) {
  if (!pathname) return false;
  return pathname === "/learn" || pathname.startsWith("/learn/") || pathname === "/exam" || pathname.startsWith("/exam/");
}

export default function RouteAwareFooter() {
  const pathname = usePathname();
  if (shouldHideFooter(pathname)) return null;
  return <BrandFooter />;
}
