"use client";

import Link, { type LinkProps } from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { navigateWithScrollReset } from "./home-navigation";

type ScrollResetLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: LinkProps["href"];
};

export default function ScrollResetLink({
  href,
  onClick,
  children,
  target,
  ...props
}: ScrollResetLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const targetHref = typeof href === "string" ? href : "/";

  return (
    <Link
      href={href}
      target={target}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;

        if (
          target === "_blank" ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();

        const currentKey =
          typeof window !== "undefined"
            ? window.location.pathname + window.location.search + window.location.hash
            : pathname;

        navigateWithScrollReset(router, pathname, currentKey, targetHref);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
