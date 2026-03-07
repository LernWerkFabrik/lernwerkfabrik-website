const mobilePlatformScript = String.raw`(() => {
  try {
    const ua = navigator.userAgent || "";
    const root = document.documentElement;

    if (/Android/i.test(ua)) {
      root.setAttribute("data-mobile-os", "android");
      return;
    }

    root.removeAttribute("data-mobile-os");
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
