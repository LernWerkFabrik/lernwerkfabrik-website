import * as React from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  kicker?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export default function SectionHeader({
  title,
  description,
  kicker,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        // Erklärung: konsistenter vertikaler Rhythmus
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="space-y-1.5">
        {kicker ? <div className="lp-kicker">{kicker}</div> : null}

        {/* Erklärung: Title nutzt unser Typography-Level */}
        <div className="lp-h2">{title}</div>

        {description ? (
          <div className="lp-muted max-w-3xl">{description}</div>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
