import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type CardLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

/**
 * Erklärung:
 * - Card bleibt Server-safe klickbar (Overlay-Link)
 * - Wrapper macht den "Tile-Lift"
 * - Overlay-Link liefert Focus-Ring
 */
export default function CardLink({
  href,
  children,
  className,
  ariaLabel,
}: CardLinkProps) {
  return (
    <div
      className={cn(
        [
          "group relative rounded-xl cursor-pointer",

          // Tile Motion
          "transition-transform duration-200 ease-out",
          "hover:-translate-y-[1px] active:translate-y-0",
        ].join(" "),
        className
      )}
    >
      {/* Overlay-Link: liegt "unter" dem Content, aber fängt Klick auf freie Fläche ab */}
      <Link
        href={href}
        aria-label={ariaLabel}
        className={cn(
          [
            "absolute inset-0 z-0 rounded-xl",

            // Focus (Keyboard)
            "outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
            "focus-visible:shadow-[0_0_0_4px_rgba(245,158,11,0.10)]",

            // Hover hint: sehr dezent
            "group-hover:ring-1 group-hover:ring-primary/12 dark:group-hover:ring-primary/10",
          ].join(" ")
        )}
      />

      {/* Content liegt darüber und bleibt klickbar */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
