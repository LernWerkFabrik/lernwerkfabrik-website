import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Ziel der Optimierung (kurz):
 * - subtiler 3D-Effekt (Depth) über: Shadow + Highlight + Active-Press
 * - konsistente Focus-Ringe (Accessibility)
 * - bessere Hover/Active States, ohne "bunt" zu wirken
 *
 * Wichtig: Wir verändern keine API (variants/sizes bleiben gleich).
 */

const buttonVariants = cva(
  [
    // Basis-Layout
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full",
    "text-sm font-medium",

    // Motion
    "transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)]",

    // Disabled
    "disabled:pointer-events-none disabled:opacity-50",

    // Focus (ring + kein Offset, weil du Ring-Design so nutzt)
    "outline-none focus-visible:ring-2 focus-visible:ring-offset-0",

    // Icons
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0",

    /**
     * 3D/Depth-Basis:
     * - shadow: leichter Lift
     * - translate: minimaler "Hover-Lift"
     * - active: fühlt sich gedrückt an
     */
    "shadow-[0_10px_24px_-20px_rgba(20,24,32,0.28)]",
    "hover:-translate-y-[1px] hover:shadow-[0_14px_34px_-22px_rgba(20,24,32,0.34)]",
    "active:translate-y-0 active:shadow-[0_8px_20px_-18px_rgba(20,24,32,0.30)]",

    /**
     * "Specular highlight" (Pseudo-3D Glanzkante):
     * - via inset shadow, wirkt wie Licht von oben
     */
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]",
    "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]",

    /**
     * Active Feel:
     * - minimaler Kontrast beim Klicken
     */
    "active:brightness-[0.98] dark:active:brightness-[1.02]",
  ].join(" "),
  {
    variants: {
      variant: {
        /**
         * 🔶 PRIMARY – ruhiger Amber, aber mit Premium-Depth
         * - leichter Glow passend zu deinem Background
         * - Hover: etwas satter + dezenter outer glow
         */
        default: cn(
          "bg-primary text-primary-foreground",
          "hover:bg-primary/95",
          "focus-visible:ring-primary/35",

          // sehr subtiler Akzent (kein starker Glow)
          "shadow-[0_12px_28px_-20px_rgba(20,24,32,0.36),0_0_0_1px_rgba(245,158,11,0.24)]",
          "hover:shadow-[0_16px_36px_-24px_rgba(20,24,32,0.42),0_0_0_1px_rgba(245,158,11,0.30)]",
          "active:shadow-[0_8px_20px_-18px_rgba(20,24,32,0.36),0_0_0_1px_rgba(245,158,11,0.26)]",

          "shadow-[inset_0_1px_0_rgba(255,255,255,0.34)]",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        ),

        /**
         * 🔴 Destructive – sauber, aber mit Depth wie Primary
         */
        destructive: cn(
          "bg-destructive/80 text-destructive-foreground",
          "hover:bg-destructive",
          "focus-visible:ring-destructive/40",

          // Glow (subtil, nicht alarmierend)
          "shadow-[0_10px_24px_-18px_rgba(0,0,0,0.45),0_0_0_1px_rgba(239,68,68,0.22),0_0_24px_rgba(239,68,68,0.10)]",
          "hover:shadow-[0_14px_34px_-22px_rgba(0,0,0,0.55),0_0_0_1px_rgba(239,68,68,0.30),0_0_34px_rgba(239,68,68,0.14)]",
          "active:shadow-[0_8px_18px_-18px_rgba(0,0,0,0.50),0_0_0_1px_rgba(239,68,68,0.24),0_0_18px_rgba(239,68,68,0.10)]",

          "shadow-[inset_0_1px_0_rgba(255,255,255,0.20)]",
          "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]"
        ),

        /**
         * 🟦 OUTLINE – "Glassy" mit 3D-Kante
         * - border + leichtes inner highlight
         * - Hover: mehr Kontrast
         */
        outline: cn(
          "border border-border/80 dark:border-primary/40",
          "bg-foreground/[0.04] dark:bg-cyan-400/10",
          "text-foreground",
          "hover:bg-foreground/[0.07] dark:hover:bg-cyan-400/18",
          "hover:border-border dark:hover:border-primary/70",
          "focus-visible:ring-primary/35",

          // Glass-Edge + Depth
          "shadow-[0_10px_26px_-20px_rgba(20,24,32,0.24),inset_0_1px_0_rgba(255,255,255,0.38)]",
          "hover:shadow-[0_14px_36px_-24px_rgba(20,24,32,0.30),inset_0_1px_0_rgba(255,255,255,0.42)]",
          "active:shadow-[0_8px_20px_-18px_rgba(20,24,32,0.26),inset_0_1px_0_rgba(255,255,255,0.34)]"
        ),

        /**
         * 🟦 SECONDARY – dezente Fläche, aber "tactile"
         */
        secondary: cn(
          "bg-foreground/[0.04] dark:bg-cyan-400/12",
          "text-foreground",
          "hover:bg-foreground/[0.07] dark:hover:bg-cyan-400/20",
          "focus-visible:ring-foreground/15 dark:focus-visible:ring-cyan-400/30",

          // minimaler Lift
          "shadow-[0_10px_26px_-20px_rgba(20,24,32,0.22),inset_0_1px_0_rgba(255,255,255,0.34)]",
          "hover:shadow-[0_14px_36px_-24px_rgba(20,24,32,0.28),inset_0_1px_0_rgba(255,255,255,0.38)]",
          "active:shadow-[0_8px_20px_-18px_rgba(20,24,32,0.24),inset_0_1px_0_rgba(255,255,255,0.32)]"
        ),

        /**
         * Ghost – keine "Platte", aber trotzdem haptisch:
         * - nur Hover/Active Hintergrund + weicher inner highlight beim Hover
         */
        ghost: cn(
          "bg-transparent",
          "hover:bg-foreground/[0.06] dark:hover:bg-cyan-400/10",
          "shadow-none hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]",
          "active:shadow-none"
        ),

        /**
         * Link – bewusst ohne 3D-Depth
         */
        link: cn(
          "text-primary underline-offset-4 hover:underline",
          "shadow-none hover:translate-y-0 active:translate-y-0"
        ),
      },

      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
