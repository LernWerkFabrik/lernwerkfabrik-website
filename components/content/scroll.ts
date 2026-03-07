// components/content/scroll.ts

export const SCROLL_OFFSET_PX = 104;

export type ScrollContainer = HTMLElement | Window;

/**
 * ✅ DER REGLER:
 * Abstand (in px) zwischen Header-Unterkante und optischer Überschrift-Kante.
 * - 0  = maximal nah unter Header
 * - 8  = angenehm
 * - 12 = etwas mehr Luft
 */
export const LANDING_GAP_PX = 50;

/** Luft unter Header (zusätzlich, selten nötig) */
const HEADER_AIR_PX = 0;

/** Sicherheitsmaximum (falls Header mal extrem hoch wird) */
const MAX_OFFSET_PX = 220;

function isWindow(x: any): x is Window {
  return typeof window !== "undefined" && x === window;
}

/** ✅ Globaler ScrollRoot */
export function getScrollRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const root = document.querySelector<HTMLElement>("[data-scroll-root]");
  if (!root) return null;

  const style = window.getComputedStyle(root);
  const oy = style.overflowY;
  const isScrollable =
    (oy === "auto" || oy === "scroll") && root.scrollHeight > root.clientHeight + 2;

  return isScrollable ? root : null;
}

/** Fallback: erster scrollbarer Parent */
function findScrollableAncestor(start: HTMLElement | null): HTMLElement | null {
  if (typeof window === "undefined") return null;

  let cur: HTMLElement | null = start;
  while (cur) {
    const style = window.getComputedStyle(cur);
    const oy = style.overflowY;

    const isScrollable =
      (oy === "auto" || oy === "scroll") && cur.scrollHeight > cur.clientHeight + 2;

    if (isScrollable) return cur;
    cur = cur.parentElement;
  }
  return null;
}

export function getBestScrollContainer(target: HTMLElement): ScrollContainer {
  const root = getScrollRoot();
  if (root) return root;

  const anc = findScrollableAncestor(target);
  if (anc) return anc;

  return window;
}

/**
 * ✅ Dynamischer Offset:
 * Mindestwert = Header-Unterkante, damit nichts unter dem Header verschwindet.
 */
export function getDynamicScrollOffsetPx(fallback = SCROLL_OFFSET_PX) {
  if (typeof document === "undefined") return fallback;

  const header = document.querySelector<HTMLElement>("[data-scroll-header]");
  if (!header) return fallback;

  const r = header.getBoundingClientRect();

  const min = Math.round(r.bottom);
  const px = Math.round(r.bottom + HEADER_AIR_PX);

  return Math.max(min, Math.min(px, MAX_OFFSET_PX));
}

/**
 * ✅ Optischer Top-Inset des Targets:
 * - padding-top der inneren Markdown-Card (data-md-card)
 * - margin-top des Headings (prose)
 */
export function getOpticalTopInsetPx(target: HTMLElement) {
  if (typeof window === "undefined") return 0;

  let inset = 0;

  const card = target.closest<HTMLElement>("[data-md-card]");
  if (card) {
    const cs = window.getComputedStyle(card);
    const pt = parseFloat(cs.paddingTop || "0");
    if (Number.isFinite(pt)) inset += Math.max(0, pt);
  }

  {
    const cs = window.getComputedStyle(target);
    const mt = parseFloat(cs.marginTop || "0");
    if (Number.isFinite(mt)) inset += Math.max(0, mt);
  }

  return inset;
}

/**
 * ✅ Effektiver Offset für Scroll UND ScrollSpy:
 * HeaderOffset + OpticalInset - LANDING_GAP_PX
 *
 * Beispiel:
 * - Header 56px
 * - Card padding-top 4px
 * - H2 margin-top 24px
 * - LANDING_GAP_PX 8px
 * => effective = 56+4+24-8 = 76px
 */
export function getEffectiveOffsetPxForTarget(target: HTMLElement) {
  const headerOffset = getDynamicScrollOffsetPx(SCROLL_OFFSET_PX);
  const opticalInset = getOpticalTopInsetPx(target);
  return headerOffset + opticalInset - LANDING_GAP_PX;
}

export function scrollToTarget(
  container: ScrollContainer | null | undefined,
  target: HTMLElement,
  opts?: { behavior?: ScrollBehavior }
) {
  const behavior = opts?.behavior ?? "auto";

  const sc =
    container ?? getScrollRoot() ?? (getBestScrollContainer(target) as ScrollContainer);

  const effectiveOffset = getEffectiveOffsetPxForTarget(target);

  if (isWindow(sc)) {
    const r = target.getBoundingClientRect();
    const top = window.scrollY + r.top - effectiveOffset;
    window.scrollTo({ top: Math.max(0, Math.round(top)), behavior });
    return;
  }

  const scEl = sc as HTMLElement;

  const sr = scEl.getBoundingClientRect();
  const tr = target.getBoundingClientRect();

  const top = scEl.scrollTop + (tr.top - sr.top) - effectiveOffset;

  scEl.scrollTo({ top: Math.max(0, Math.round(top)), behavior });
}

/** Für ScrollSpy */
export function getScrollTop(container: ScrollContainer) {
  return isWindow(container) ? window.scrollY : container.scrollTop;
}
