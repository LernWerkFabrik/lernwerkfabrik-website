export const THEME_STORAGE_KEY = "theme";
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type AppTheme = "light" | "dark";

export function normalizeTheme(value?: string | null): AppTheme {
  return value === "light" ? "light" : "dark";
}
