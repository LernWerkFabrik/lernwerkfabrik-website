export const HOME_SCROLL_STORAGE_KEY = "lwf:scroll:v1";

type HomeRouter = {
  push: (href: string) => void;
};

export function scrollPageToTop() {
  if (typeof window === "undefined") return;

  const root = document.querySelector("main[data-scroll-root]");
  if (root instanceof HTMLElement) {
    root.scrollTop = 0;
  }

  const scrollingElement = document.scrollingElement || document.documentElement || document.body;
  if (scrollingElement) {
    scrollingElement.scrollTop = 0;
  }

  document.documentElement.scrollTop = 0;
  if (document.body) {
    document.body.scrollTop = 0;
  }

  window.scrollTo(0, 0);
}

export function scheduleScrollPageToTop() {
  if (typeof window === "undefined") return;

  scrollPageToTop();
  window.requestAnimationFrame(() => scrollPageToTop());
  window.setTimeout(() => scrollPageToTop(), 0);
  window.setTimeout(() => scrollPageToTop(), 80);
  window.setTimeout(() => scrollPageToTop(), 220);
}

export function clearStoredScroll(keys: string[]) {
  if (typeof window === "undefined") return;

  try {
    const raw = window.sessionStorage.getItem(HOME_SCROLL_STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;

    let changed = false;
    for (const key of keys) {
      if (key in parsed) {
        delete parsed[key];
        changed = true;
      }
    }

    if (changed) {
      window.sessionStorage.setItem(HOME_SCROLL_STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}

export function resetHomeScroll(currentKey?: string | null) {
  const keys = ["/"];
  if (currentKey) {
    keys.push(currentKey);
  }
  clearStoredScroll(keys);
}

export function navigateHome(
  router: HomeRouter,
  pathname: string | null,
  currentKey?: string | null,
  href = "/"
) {
  resetHomeScroll(currentKey);
  scheduleScrollPageToTop();

  if (pathname !== href) {
    router.push(href);
    window.setTimeout(() => scheduleScrollPageToTop(), 24);
  }
}