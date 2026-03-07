"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

import { THEME_COOKIE_MAX_AGE, THEME_STORAGE_KEY, type AppTheme } from "./theme-config";

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
    if (!mounted) return;

    document.cookie =
      `${THEME_STORAGE_KEY}=${currentTheme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
  }, [currentTheme, mounted]);

  const handleThemeChange = React.useEffectEvent((nextTheme: AppTheme) => {
    setTheme(nextTheme);
    document.cookie =
      `${THEME_STORAGE_KEY}=${nextTheme}; Path=/; Max-Age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
  });

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
        onClick={() => handleThemeChange("dark")}
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
        onClick={() => handleThemeChange("light")}
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
