import Script from "next/script";

const scrollRestorationHeadScript = String.raw`(() => {
  const STORAGE_KEY = "lwf:scroll:v1";
  const RESTORING_ATTR = "data-scroll-restoring";
  const key = window.location.pathname + window.location.search + window.location.hash;
  const isMobileViewport = () => window.matchMedia("(max-width: 767px)").matches;

  const getScrollingElement = () =>
    document.scrollingElement || document.documentElement || document.body;

  const setWindowScroll = (y) => {
    const top = Math.max(Number.isFinite(y) ? y : 0, 0);
    const scrollingElement = getScrollingElement();
    if (scrollingElement) {
      scrollingElement.scrollTop = top;
    }
    document.documentElement.scrollTop = top;
    if (document.body) {
      document.body.scrollTop = top;
    }
    window.scrollTo(0, top);
  };

  try {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = isMobileViewport() ? "auto" : "manual";
    }
  } catch {
    // ignore
  }

  if (isMobileViewport()) return;

  if (window.location.hash) return;

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;

    const entry = parsed[key];
    if (!entry || typeof entry !== "object") return;

    const rootY = Number.isFinite(entry.rootY) ? entry.rootY : 0;
    const windowY = Number.isFinite(entry.windowY) ? entry.windowY : 0;
    if (rootY <= 2 && windowY <= 2) return;

    window.__LWF_SCROLL_ENTRY__ = entry;
    document.documentElement.setAttribute(RESTORING_ATTR, "1");
    setWindowScroll(windowY);
  } catch {
    // ignore
  }
})();`;

const scrollRestorationScript = String.raw`(() => {
  const STORAGE_KEY = "lwf:scroll:v1";
  const MAX_ENTRIES = 50;
  const MAX_RESTORE_ATTEMPTS = 60;
  const RESTORING_ATTR = "data-scroll-restoring";
  const REVEAL_TIMEOUT_MS = 4000;
  const REVEAL_SETTLE_MS = 180;
  const SAVE_SETTLE_MS = 180;
  const isMobileViewport = () => window.matchMedia("(max-width: 767px)").matches;

  const getKey = () => window.location.pathname + window.location.search + window.location.hash;

  const readMap = () => {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  };

  const writeMap = (map) => {
    try {
      const entries = Object.entries(map)
        .sort((a, b) => ((b[1] && b[1].ts) || 0) - ((a[1] && a[1].ts) || 0))
        .slice(0, MAX_ENTRIES);
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
    } catch {
      // ignore
    }
  };

  const getScrollRoot = () => document.querySelector("main[data-scroll-root]");

  const getScrollingElement = () =>
    document.scrollingElement || document.documentElement || document.body;

  const getWindowScrollY = () => {
    const scrollingElement = getScrollingElement();
    return Math.max(
      window.scrollY || 0,
      window.pageYOffset || 0,
      document.documentElement.scrollTop || 0,
      document.body ? document.body.scrollTop || 0 : 0,
      scrollingElement ? scrollingElement.scrollTop || 0 : 0
    );
  };

  const setWindowScroll = (y) => {
    const top = Math.max(Number.isFinite(y) ? y : 0, 0);
    const scrollingElement = getScrollingElement();
    if (scrollingElement) {
      scrollingElement.scrollTop = top;
    }
    document.documentElement.scrollTop = top;
    if (document.body) {
      document.body.scrollTop = top;
    }
    window.scrollTo(0, top);
  };

  const canUseScrollRoot = (root) => {
    if (!root) return false;
    const style = window.getComputedStyle(root);
    const overflowY = style.overflowY;
    const supportsScroll = overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay";
    return supportsScroll && root.scrollHeight > root.clientHeight + 1;
  };

  const getWindowScrollableMaxY = () => {
    const scrollingElement = getScrollingElement();
    const scrollHeight = Math.max(
      scrollingElement ? scrollingElement.scrollHeight : 0,
      document.documentElement ? document.documentElement.scrollHeight : 0,
      document.body ? document.body.scrollHeight : 0
    );
    const viewportHeight =
      window.innerHeight ||
      (window.visualViewport ? window.visualViewport.height : 0) ||
      document.documentElement.clientHeight ||
      0;
    return Math.max(scrollHeight - viewportHeight, 0);
  };

  const canReachWindowTarget = (targetY) => getWindowScrollableMaxY() + 1 >= Math.max(targetY, 0);

  const canReachRootTarget = (root, targetY) => {
    if (!root) return false;
    return root.scrollHeight - root.clientHeight + 1 >= Math.max(targetY, 0);
  };

  const getEntry = () => {
    const cached = window.__LWF_SCROLL_ENTRY__;
    if (cached && typeof cached === "object") return cached;

    const entry = readMap()[getKey()];
    if (!entry || typeof entry !== "object") return null;
    return entry;
  };

  const shouldHideDuringRestore = () => {
    if (window.location.hash) return false;
    const entry = getEntry();
    if (!entry) return false;
    const rootY = Number.isFinite(entry.rootY) ? entry.rootY : 0;
    const windowY = Number.isFinite(entry.windowY) ? entry.windowY : 0;
    return rootY > 2 || windowY > 2;
  };

  const markRestoring = () => {
    document.documentElement.setAttribute(RESTORING_ATTR, "1");
  };

  const clearRestoring = () => {
    document.documentElement.removeAttribute(RESTORING_ATTR);
  };

  const buildEntry = () => {
    const root = getScrollRoot();
    const useRoot = canUseScrollRoot(root);
    return {
      rootY: useRoot ? Math.max(root.scrollTop, 0) : 0,
      ts: Date.now(),
      windowY: getWindowScrollY(),
    };
  };

  const capture = () => {
    const entry = buildEntry();
    window.__LWF_SCROLL_ENTRY__ = entry;
    return entry;
  };

  const persist = () => {
    const map = readMap();
    map[getKey()] = capture();
    writeMap(map);
  };

  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = isMobileViewport() ? "auto" : "manual";
  }

  if (isMobileViewport()) {
    clearRestoring();
    return;
  }

  let saveFrame = 0;
  let saveTimer = 0;
  let restoreTimer = 0;
  let forceRevealTimer = 0;
  let settleRevealTimer = 0;

  const clearSaveTimer = () => {
    if (!saveTimer) return;
    window.clearTimeout(saveTimer);
    saveTimer = 0;
  };

  const clearRestoreTimer = () => {
    if (!restoreTimer) return;
    window.clearTimeout(restoreTimer);
    restoreTimer = 0;
  };

  const clearForceRevealTimer = () => {
    if (!forceRevealTimer) return;
    window.clearTimeout(forceRevealTimer);
    forceRevealTimer = 0;
  };

  const clearSettleRevealTimer = () => {
    if (!settleRevealTimer) return;
    window.clearTimeout(settleRevealTimer);
    settleRevealTimer = 0;
  };

  if (shouldHideDuringRestore()) {
    markRestoring();
    clearForceRevealTimer();
    forceRevealTimer = window.setTimeout(() => {
      clearRestoring();
    }, REVEAL_TIMEOUT_MS);
  }

  const scheduleSave = () => {
    if (saveFrame) return;
    saveFrame = window.requestAnimationFrame(() => {
      saveFrame = 0;
      capture();
      clearSaveTimer();
      saveTimer = window.setTimeout(() => {
        saveTimer = 0;
        persist();
      }, SAVE_SETTLE_MS);
    });
  };

  const attachRootListener = (attempt = 0) => {
    const root = getScrollRoot();
    if (root) {
      root.addEventListener("scroll", scheduleSave, { passive: true });
      return;
    }
    if (attempt >= 20) return;
    window.requestAnimationFrame(() => attachRootListener(attempt + 1));
  };

  const reveal = () => {
    clearRestoreTimer();
    clearForceRevealTimer();
    clearSettleRevealTimer();
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        clearRestoring();
      });
    });
  };

  const finishRestore = () => {
    clearRestoreTimer();
    clearSettleRevealTimer();
    settleRevealTimer = window.setTimeout(() => {
      const entry = getEntry();
      if (!entry) {
        reveal();
        return;
      }

      const root = getScrollRoot();
      const usingRoot = canUseScrollRoot(root);
      const targetRootY = Number.isFinite(entry.rootY) ? entry.rootY : 0;
      const targetWindowY = Number.isFinite(entry.windowY) ? entry.windowY : 0;
      const currentY = usingRoot ? root.scrollTop : getWindowScrollY();
      const targetY = usingRoot ? targetRootY : targetWindowY;

      if (Math.abs(currentY - targetY) <= 1) {
        reveal();
        return;
      }

      restore();
    }, REVEAL_SETTLE_MS);
  };

  const scheduleRestore = (attempt, delay) => {
    clearRestoreTimer();
    clearSettleRevealTimer();
    restoreTimer = window.setTimeout(() => {
      window.requestAnimationFrame(() => restore(attempt));
    }, delay);
  };

  const restore = (attempt = 0) => {
    clearSettleRevealTimer();

    if (window.location.hash) {
      finishRestore();
      return;
    }

    const entry = getEntry();
    if (!entry) {
      finishRestore();
      return;
    }

    const root = getScrollRoot();
    const targetRootY = Number.isFinite(entry.rootY) ? entry.rootY : 0;
    const targetWindowY = Number.isFinite(entry.windowY) ? entry.windowY : 0;
    const usingRoot = canUseScrollRoot(root);
    const targetY = usingRoot ? targetRootY : targetWindowY;
    const canReachTarget = usingRoot
      ? canReachRootTarget(root, targetRootY)
      : canReachWindowTarget(targetWindowY);

    if (!canReachTarget && attempt < MAX_RESTORE_ATTEMPTS) {
      scheduleRestore(attempt + 1, attempt < 12 ? 60 : 140);
      return;
    }

    if (usingRoot) {
      root.scrollTop = targetRootY;
    } else {
      setWindowScroll(targetWindowY);
    }

    if (attempt >= MAX_RESTORE_ATTEMPTS) {
      finishRestore();
      return;
    }

    const currentY = usingRoot ? root.scrollTop : getWindowScrollY();

    if (Math.abs(currentY - targetY) <= 1) {
      finishRestore();
      return;
    }

    scheduleRestore(attempt + 1, attempt < 12 ? 60 : 140);
  };

  window.addEventListener("scroll", scheduleSave, { passive: true });
  window.addEventListener("pagehide", persist, { capture: true });
  window.addEventListener("beforeunload", persist, { capture: true });
  window.addEventListener("load", () => restore(), { once: true });
  window.addEventListener("resize", () => restore());
  window.addEventListener("pageshow", () => restore());
  window.addEventListener("popstate", () => {
    window.setTimeout(() => restore(), 0);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => restore());
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") persist();
  });

  attachRootListener();

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        window.requestAnimationFrame(() => restore());
      },
      { once: true }
    );
  } else {
    window.requestAnimationFrame(() => restore());
  }
})();`;

export default function ScrollRestoration() {
  return (
    <Script id="lwf-scroll-restoration" strategy="beforeInteractive">
      {scrollRestorationScript}
    </Script>
  );
}

export function ScrollRestorationHead() {
  return (
    <>
      <style
        id="lwf-scroll-restoration-style"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html:
            'html[data-scroll-restoring="1"] main[data-scroll-root]{visibility:hidden;}@media (max-width:767px){html[data-scroll-restoring="1"] body{visibility:hidden;opacity:0!important;}}',
        }}
      />
      <script
        id="lwf-scroll-restoration-head"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: scrollRestorationHeadScript }}
      />
    </>
  );
}
