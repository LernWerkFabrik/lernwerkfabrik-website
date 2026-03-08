"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";

import { resetHomeScroll, scrollPageToTop } from "./home-navigation";

type HomeResetLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href?: LinkProps["href"];
};

export default function HomeResetLink({
  href = "/",
  onClick,
  children,
  ...props
}: HomeResetLinkProps) {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        const currentKey =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search + window.location.hash
            : pathname;

        resetHomeScroll(currentKey);

        if (pathname === "/") {
          event.preventDefault();
          scrollPageToTop();
        }
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
