import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Optimierung (kurz):
 * - Cards sollen nicht "weiß/flach" wirken, sondern wie Premium-Panels.
 * - Wir nutzen:
 *   1) weiche Border (nicht zu hart)
 *   2) inset highlight (Lichtkante)
 *   3) deeper shadow (Depth)
 *   4) optionaler Hover-Lift (subtil, nicht nervig)
 *
 * Wichtig: keine API-Änderung, nur bessere Default-Styles.
 */

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        [
          // Layout
          "flex flex-col gap-6 rounded-xl py-6",

          // Surface (bleibt kompatibel mit deinen CSS-Variablen)
          "bg-card text-card-foreground",
          "dark:bg-card",

          // Material / Depth: weich, hochwertig, ohne harte Border
          "shadow-[0_18px_46px_-34px_rgba(20,24,32,0.22)]",
          "dark:shadow-[0_18px_44px_-28px_rgba(0,0,0,0.55)]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.62),inset_0_0_0_1px_rgba(20,24,32,0.045)]",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.10),inset_0_0_0_1px_rgba(255,255,255,0.06)]",

          // Motion: subtiler Lift (wie bei Buttons), damit es nicht statisch wirkt
          "transition-shadow duration-200 ease-[cubic-bezier(.4,0,.2,1)]",
          "hover:shadow-[0_24px_58px_-38px_rgba(20,24,32,0.28)]",
          "dark:hover:shadow-[0_26px_60px_-38px_rgba(0,0,0,0.62)]",
        ].join(" "),
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
