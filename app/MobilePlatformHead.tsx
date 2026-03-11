const mobilePlatformScript = String.raw`(() => {
  try {
    const ua = navigator.userAgent || "";
    const root = document.documentElement;
    const isAndroid = /Android/i.test(ua);
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isLanding = window.location.pathname === "/";

    if (isAndroid) {
      root.setAttribute("data-mobile-os", "android");
    } else if (isIos) {
      root.setAttribute("data-mobile-os", "ios");
    } else {
      root.removeAttribute("data-mobile-os");
    }

    if (isAndroid && isLanding) {
      root.setAttribute("data-mobile-compact", "1");
      return;
    }

    root.removeAttribute("data-mobile-compact");
  } catch {
    // ignore
  }
})();`;

export default function MobilePlatformHead() {
  return (
    <script
      id="lwf-mobile-platform"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: mobilePlatformScript }}
    />
  );
}
