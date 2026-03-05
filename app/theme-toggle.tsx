"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export default function ThemeToggle({
  className,
  buttonClassName,
}: {
  className?: string;
  buttonClassName?: string;
}) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted
    ? (theme === "system" ? resolvedTheme : theme) ?? "dark"
    : "dark";

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", currentTheme === "dark");
  }, [currentTheme]);

  return (
    <div
      className={cn(
        "flex items-center rounded-full border border-border/60 bg-background/60 p-1 backdrop-blur",
        className
      )}
    >
      {/* 🌙 DARK */}
      <button
        aria-label="Dunkelmodus"
        onClick={() => setTheme("dark")}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition",
          buttonClassName,
          currentTheme === "dark"
            ? "bg-amber-500/20 text-amber-300 shadow-inner"
            : "text-foreground/60 hover:text-foreground"
        )}
      >
        <Moon className="h-4 w-4" />
      </button>

      {/* ☀️ LIGHT */}
      <button
        aria-label="Hellmodus"
        onClick={() => setTheme("light")}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full transition",
          buttonClassName,
          currentTheme === "light"
            ? "bg-amber-400/25 text-amber-700 shadow-inner"
            : "text-foreground/60 hover:text-foreground"
        )}
      >
        <Sun className="h-4 w-4" />
      </button>
    </div>
  );
}
