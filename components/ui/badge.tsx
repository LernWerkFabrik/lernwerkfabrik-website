import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Optimierungsziele:
 * - Badges sollen nicht wie "Sticker" wirken
 * - mehr Materialität (Panel/Chip statt Label)
 * - weniger Weiß, mehr kontrollierter Kontrast
 * - konsistent mit Card & Button Depth
 */

const badgeVariants = cva(
  [
    // Layout
    "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",

    // Motion & Interaction
    "transition-all duration-200 ease-out",

    // Trennung vom Hintergrund
    "border",

    /**
     * Material-Effekt:
     * - leichte Lichtkante (oben)
     * - sehr sanfter Schatten (Depth)
     */
    "shadow-[0_6px_14px_-12px_rgba(0,0,0,0.45)]",
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]",
    "dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]",

    /**
     * Hover:
     * - minimaler Lift
     * - Badge fühlt sich "tactile" an
     */
    "hover:-translate-y-[0.5px]",
    "hover:shadow-[0_10px_20px_-14px_rgba(0,0,0,0.55)]",
  ].join(" "),
  {
    variants: {
      variant: {
        /**
         * 🟦 DEFAULT
         * Primäre Meta-Info (Slug, Modul-ID)
         * → leicht „glassy“, ruhig, nicht dominant
         */
        default: cn(
          "bg-cyan-500/16 dark:bg-cyan-400/18",
          "text-foreground",
          "border-cyan-400/35 dark:border-cyan-300/40"
        ),

        /**
         * 🟦 SECONDARY
         * Zeit / Meta-Infos
         * → bewusst zurückhaltender
         */
        secondary: cn(
          "bg-cyan-500/10 dark:bg-cyan-400/12",
          "text-muted-foreground",
          "border-cyan-400/25 dark:border-cyan-300/30",

          // weniger Shadow → niedrigere Hierarchie
          "shadow-[0_4px_10px_-10px_rgba(0,0,0,0.35)]",
          "hover:shadow-[0_6px_14px_-12px_rgba(0,0,0,0.45)]"
        ),

        /**
         * 🔶 OUTLINE
         * Akzent / Hervorhebung
         * → kein Glas, sondern „UI-Chip“
         */
        outline: cn(
          "bg-transparent",
          "text-foreground",
          "border-primary/45",

          // klare Kante, weniger Glas
          "shadow-none",
          "hover:border-primary/70",
          "hover:bg-primary/6"
        ),

        /**
         * 🔴 DESTRUCTIVE
         * Warn-/Statusbadge
         * → sichtbar, aber nicht alarmierend
         */
        destructive: cn(
          "bg-destructive/14",
          "text-destructive",
          "border-destructive/40",

          // etwas mehr Tiefe für Wichtigkeit
          "shadow-[0_6px_16px_-12px_rgba(0,0,0,0.45)]",
          "hover:bg-destructive/18"
        ),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>) {
  return (
    <div
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
