export const THEME_STORAGE_KEY = "theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type AppTheme = "light" | "dark";

export function normalizeTheme(value?: string | null): AppTheme {
  return value === "light" ? "light" : "dark";
}

export const THEME_HEAD_SCRIPT = String.raw`(() => {
  const STORAGE_KEY = "theme";

  const readCookie = (name) => {
    const prefix = name + "=";
    const parts = document.cookie ? document.cookie.split(";") : [];
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith(prefix)) {
        return trimmed.slice(prefix.length);
      }
    }
    return null;
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const cookieValue = readCookie(STORAGE_KEY);
    const value = stored || cookieValue || "dark";
    const theme = value === "light" ? "light" : "dark";
    const root = document.documentElement;

    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }
})();`;
