import * as React from "react";
import { cn } from "@/lib/utils";

type SurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  gradient?: boolean;
  tone?: "neutral" | "amber" | "cyan";
};

export default function Surface({
  className,
  gradient = true,
  tone = "neutral",
  ...props
}: SurfaceProps) {
  const showCyan = tone === "neutral" || tone === "cyan";
  const showAmber = tone === "neutral" || tone === "amber";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border shadow-sm",
        // etwas transparenter, damit der Verlauf immer durchkommt
        "bg-transparent backdrop-blur lp-card-panel-weak dark:bg-card/30",
        className
      )}
      {...props}
    >
      {gradient && (
        <>
          {/* Linearer Grundverlauf – sorgt dafür,
              dass auch flache Container (Header) Cyan zeigen */}
          <div
            className={cn(
              "pointer-events-none absolute inset-0",
              "bg-gradient-to-r",
              showCyan
                ? "from-cyan-400/18 dark:from-cyan-300/22"
                : "from-transparent",
              "via-transparent",
              showAmber
                ? "to-amber-400/14 dark:to-amber-300/18"
                : "to-transparent"
            )}
          />

          {/* Radial links (Cyan) – wirkt stärker bei hohen Containern */}
          {showCyan && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(600px circle at 0% 0%, rgba(34,211,238,0.14), transparent 55%)",
              }}
            />
          )}

          {/* Radial rechts (Amber) */}
          {showAmber && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(700px circle at 100% 0%, rgba(251,191,36,0.12), transparent 60%)",
              }}
            />
          )}
        </>
      )}

      {/* feine obere Linie */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px
        bg-gradient-to-r from-transparent via-border/80 to-transparent"
      />

      <div className="relative">{props.children}</div>
    </div>
  );
}
