// app/BrandLogo.tsx
import Image from "next/image";
import clsx from "clsx";

/**
 * BrandLogo - FINAL (veredelte Wortmarke)
 * --------------------------------------
 * - LWF = Monogramm (PNG, dark/light via CSS)
 * - LernWerkFabrik = eine Marke, typografisch differenziert
 * - Keine Trennzeichen, keine Spielereien
 */

type BrandLogoProps = {
  className?: string;
  variant?: "mark" | "word";
};

export default function BrandLogo({ className, variant = "mark" }: BrandLogoProps) {
  return (
    <div
      data-brand-logo={variant}
      className={clsx("flex items-center gap-4", className)}
      aria-label="LernWerkFabrik"
    >
      {variant === "mark" ? (
        <div className="relative h-8 w-[56px]">
          {/* Light mode */}
          <Image
            src="/brand/logo-lwf-dark.png"
            alt="LWF Logo"
            fill
            sizes="56px"
            priority
            className="object-contain block dark:hidden"
          />
          {/* Dark mode */}
          <Image
            src="/brand/logo-lwf-light.png"
            alt="LWF Logo"
            fill
            sizes="56px"
            priority
            className="object-contain hidden dark:block"
          />
        </div>
      ) : null}

      {/* Veredelte Wortmarke */}
      {variant === "word" ? (
        <div className="lp-android-header-word flex items-center text-[17px] tracking-tight text-foreground">
          <span className="font-medium">Lern</span>

          {/* Mikroabstand - unsichtbar, aber strukturiert */}
          <span className="mx-[1px] font-semibold text-primary">Werk</span>

          <span className="font-medium">Fabrik</span>
        </div>
      ) : null}
    </div>
  );
}
