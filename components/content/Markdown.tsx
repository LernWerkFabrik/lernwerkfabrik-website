"use client";

import React, { useEffect, useMemo, useRef, useState, useId } from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { slugify, stripInlineMarkdown, getText } from "@/components/content/utils";
import {
  SCROLL_OFFSET_PX,
  getBestScrollContainer,
  scrollToTarget,
  getScrollRoot,
  getDynamicScrollOffsetPx,
} from "@/components/content/scroll";
import { detectCalloutKind, calloutMeta, stripLeadingLabel } from "@/components/content/callouts";
import { replaceShapeTokens, renderShapeInlineToken } from "@/components/content/mdShapes";
import { buildTocFromRoot, getTocHeadingNodes, keepActiveTocItemVisible } from "@/components/content/toc";

function cx(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}

function normalizeLatexDelimiters(src: string) {
  return src
    .replace(/\\\[\s*([\s\S]*?)\s*\\\]/g, (_m, expr: string) => `\n$$\n${expr.trim()}\n$$\n`)
    .replace(/\\\((.+?)\\\)/g, (_m, expr: string) => `$${expr.trim()}$`);
}

function isStandaloneShapeParagraph(children: React.ReactNode) {
  const txt = stripInlineMarkdown(getText(children)).trim();
  if (!txt) return false;

  const re = /^(\[\[shape:[a-z0-9_-]+\]\])(\s+(\[\[shape:[a-z0-9_-]+\]\]))*$/i;
  return re.test(txt);
}

function containsShapeToken(children: React.ReactNode) {
  return /\[\[shape:[a-z0-9_-]+\]\]/i.test(getText(children));
}

function renderMarkdownChildren(children: React.ReactNode) {
  if (!containsShapeToken(children)) return children;
  return replaceShapeTokens(children);
}

function renderStandaloneShapeChildren(children: React.ReactNode) {
  const tokens = getText(children).match(/\[\[shape:[a-z0-9_-]+\]\]/gi) ?? [];
  if (!tokens.length) return renderMarkdownChildren(children);

  return (
    <div className="flex flex-wrap items-start justify-center gap-2">
      {tokens.map((token, idx) => (
        <React.Fragment key={`${token}-${idx}`}>{renderShapeInlineToken(token)}</React.Fragment>
      ))}
    </div>
  );
}

type MarkdownMode = "default" | "formula";

type TocItem = {
  id: string;
  text: string;
  depth: number;
};

function isWindow(x: any): x is Window {
  return typeof window !== "undefined" && x === window;
}

/**
 * ✅ Korrekte Y-Berechnung (Viewport-Koordinaten):
 * - window: rect.top
 * - element scroller: rect.top - scrollerRect.top
 */
function getViewportTop(el: HTMLElement, scroller: Window | HTMLElement) {
  const r = el.getBoundingClientRect();
  if (isWindow(scroller)) return r.top;

  const sr = (scroller as HTMLElement).getBoundingClientRect();
  return r.top - sr.top;
}

function getMarkdownCardPaddingTopPx(target: HTMLElement) {
  if (typeof window === "undefined") return 0;
  const card = target.closest<HTMLElement>("[data-md-card]");
  if (!card) return 0;
  const cs = window.getComputedStyle(card);
  const pt = parseFloat(cs.paddingTop || "0");
  return Number.isFinite(pt) ? Math.max(0, pt) : 0;
}

function getTargetMarginTopPx(target: HTMLElement) {
  if (typeof window === "undefined") return 0;
  const cs = window.getComputedStyle(target);
  const mt = parseFloat(cs.marginTop || "0");
  return Number.isFinite(mt) ? Math.max(0, mt) : 0;
}

/**
 * ✅ Hydration-safe Heading IDs:
 * - Keine Render-Counter (können SSR/CSR driften)
 * - Deterministisch: baseSlug + AST position offset
 */
function getHeadingId(params: { prefix: string; textRaw: string; fallback: string; node?: any }) {
  const base = slugify(params.textRaw || params.fallback);
  const off = params.node?.position?.start?.offset;
  const suffix = typeof off === "number" && Number.isFinite(off) ? `-${off}` : "";
  return `${params.prefix}${base}${suffix}`;
}

export default function Markdown({
  source,
  withToc = false,
  layout = "card",
  mode = "default",
  className,
  contentClassName,
  tocSticky = true,
}: {
  source: string;
  withToc?: boolean;
  layout?: "card" | "bare";
  mode?: MarkdownMode;
  className?: string;
  contentClassName?: string;
  tocSticky?: boolean;
}) {
  const normalizedSource = useMemo(
    () =>
      normalizeLatexDelimiters(
        source
        .replace(/\r\n?/g, "\n")
        .replace(/\u00a0/g, " ")
        .normalize("NFC")
      ),
    [source]
  );

  const rid = useId().replace(/[:]/g, "");
  const prefix = `md-${rid}-`;

  const contentRef = useRef<HTMLElement | null>(null);
  const tocScrollRef = useRef<HTMLDivElement | null>(null);

  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // ✅ Hydration-safe: SSR + erster Client-Render nutzen denselben Offset (Fallback)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const offsetPx = useMemo(() => {
    if (!mounted) return SCROLL_OFFSET_PX;
    // ab Mount: dynamisch messen (kann je nach Free/Pro anders sein)
    return getDynamicScrollOffsetPx(SCROLL_OFFSET_PX);
  }, [mounted]);

  const showToc = withToc && toc.length > 0;

  /**
   * ✅ Lock gegen "Durch-Highlighten" während smooth scroll.
   * - wird zeitbasiert gelöst
   * - wird sofort gelöst, wenn User aktiv scrollt (wheel/touch/keydown)
   */
  const spyLockRef = useRef<{ until: number; id: string | null }>({ until: 0, id: null });

  function lockSpyTo(id: string, durationMs = 650) {
    spyLockRef.current = { id, until: Date.now() + durationMs };
  }

  function clearSpyLock() {
    spyLockRef.current = { id: null, until: 0 };
  }

  function isSpyLocked() {
    return !!spyLockRef.current.id && Date.now() < spyLockRef.current.until;
  }

  // ✅ TOC aus DOM (IDs müssen existieren) – initial + nach source change
  useEffect(() => {
    if (!withToc) {
      setToc([]);
      return;
    }
    if (!contentRef.current) return;

    const t = window.setTimeout(() => {
      if (!contentRef.current) return;

      const items = buildTocFromRoot(contentRef.current as any) as any[];

      const normalized: TocItem[] = (items || [])
        .map((it) => ({
          id: String(it?.id ?? ""),
          text: String(it?.text ?? it?.label ?? it?.title ?? ""),
          depth: Number(it?.depth ?? it?.level ?? 2),
        }))
        .filter((x) => x.id && x.text);

      setToc(normalized);
    }, 0);

    return () => window.clearTimeout(t);
  }, [normalizedSource, withToc]);

  // ✅ ScrollSpy
  useEffect(() => {
    if (!withToc) return;
    if (!contentRef.current) return;
    if (!toc.length) return;

    const root = contentRef.current;

    const forced = getScrollRoot?.() as HTMLElement | null;

    const scroller: Window | HTMLElement = (forced ?? getBestScrollContainer(root as any)) as any;

    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        // ✅ während programmatic smooth scroll kein "Durch-Highlighten"
        if (isSpyLocked()) {
          setActiveId(spyLockRef.current.id);
          return;
        }

        const headings = getTocHeadingNodes(root as any);
        if (!headings.length) return;

        let best: HTMLElement | null = null;

        for (const h of headings) {
          const vt = getViewportTop(h, scroller);
          const extraTop = getMarkdownCardPaddingTopPx(h) + getTargetMarginTopPx(h);
          const y = vt - offsetPx - extraTop;

          if (y <= 8) best = h;
          else break;
        }

        const id = best?.id ?? null;
        setActiveId(id);

        if (id && tocScrollRef.current) {
          keepActiveTocItemVisible(tocScrollRef.current as any, id);
        }
      });
    };

    // ✅ User-Interaktion löst Lock sofort
    const unlockOnUserIntent = () => clearSpyLock();

    onScroll();

    if (isWindow(scroller)) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      window.addEventListener("wheel", unlockOnUserIntent, { passive: true });
      window.addEventListener("touchstart", unlockOnUserIntent, { passive: true });
      window.addEventListener("keydown", unlockOnUserIntent);

      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        window.removeEventListener("wheel", unlockOnUserIntent);
        window.removeEventListener("touchstart", unlockOnUserIntent);
        window.removeEventListener("keydown", unlockOnUserIntent);
        cancelAnimationFrame(raf);
      };
    }

    (scroller as HTMLElement).addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("wheel", unlockOnUserIntent, { passive: true });
    window.addEventListener("touchstart", unlockOnUserIntent, { passive: true });
    window.addEventListener("keydown", unlockOnUserIntent);

    return () => {
      (scroller as HTMLElement).removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("wheel", unlockOnUserIntent);
      window.removeEventListener("touchstart", unlockOnUserIntent);
      window.removeEventListener("keydown", unlockOnUserIntent);
      cancelAnimationFrame(raf);
    };
  }, [toc, withToc, offsetPx]);

  const components: Components = {
    h1: ({ node, children, ...props }: any) => {
      const text = stripInlineMarkdown(getText(children).trim());
      const id = getHeadingId({ prefix, textRaw: text, fallback: "chapter", node });

      return (
        <h1
          id={id}
          {...props}
          style={{ scrollMarginTop: offsetPx }}
          className="mb-3 text-2xl font-semibold tracking-tight text-foreground clear-both dark:text-neutral-50"
        >
          {renderMarkdownChildren(children)}
        </h1>
      );
    },

    h2: ({ node, children, ...props }: any) => {
      const text = stripInlineMarkdown(getText(children).trim());
      const id = getHeadingId({ prefix, textRaw: text, fallback: "section", node });

      return (
        <div className="mt-0 clear-both">
          <h2
            id={id}
            {...props}
            style={{ scrollMarginTop: offsetPx }}
            className="group mb-3 border-b border-border/70 pb-2 text-xl font-semibold tracking-tight text-foreground dark:border-neutral-800/80 dark:text-neutral-50"
          >
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-amber-400/60 align-middle" />
            {renderMarkdownChildren(children)}
          </h2>
        </div>
      );
    },

    h3: ({ node, children, ...props }: any) => {
      const text = stripInlineMarkdown(getText(children).trim());
      const id = getHeadingId({ prefix, textRaw: text, fallback: "subsection", node });

      return (
        <h3
          id={id}
          {...props}
          style={{ scrollMarginTop: offsetPx }}
          className="mt-5 mb-2 text-lg font-medium tracking-tight text-foreground clear-both dark:text-neutral-50"
        >
          {renderMarkdownChildren(children)}
        </h3>
      );
    },

    h4: ({ node, children, ...props }: any) => {
      const text = stripInlineMarkdown(getText(children).trim());
      const id = getHeadingId({ prefix, textRaw: text, fallback: "subsubsection", node });

      return (
        <h4
          id={id}
          {...props}
          style={{ scrollMarginTop: offsetPx }}
          className="mt-4 mb-2 text-base font-semibold tracking-tight text-foreground/90 clear-both dark:text-neutral-100"
        >
          {renderMarkdownChildren(children)}
        </h4>
      );
    },

    p: ({ children, ...props }: any) => {
      const domProps = { ...props } as Record<string, unknown>;
      delete domProps.node;
      const standalone = mode === "formula" && isStandaloneShapeParagraph(children);

      if (standalone) {
        return (
          <div
            {...domProps}
            className="my-3 mb-3 w-full max-w-full rounded-2xl border border-border/60 bg-transparent p-3 md:float-right md:mb-4 md:ml-6 md:w-[220px] md:max-w-[40%]"
          >
            {renderStandaloneShapeChildren(children)}
          </div>
        );
      }

        return (
        <p
          {...domProps}
          className={
            mode === "formula"
              ? "my-3 text-left leading-relaxed text-foreground/90 dark:text-neutral-100/90"
              : "my-3 text-justify hyphens-auto leading-relaxed text-foreground/85 dark:text-neutral-100/85"
          }
        >
          {renderMarkdownChildren(children)}
        </p>
      );
    },

    ul: (props) => <ul {...props} className="my-3 list-disc space-y-1 pl-6 text-foreground/85 dark:text-neutral-100/85" />,
    ol: (props) => <ol {...props} className="my-3 list-decimal space-y-1 pl-6 text-foreground/85 dark:text-neutral-100/85" />,

    li: ({ node: _node, children, ...props }: any) => (
      <li {...props} className="leading-relaxed">
        {children}
      </li>
    ),

    hr: () =>
      mode === "formula" ? null : <div className="my-8 h-px w-full bg-border/70 clear-both dark:bg-neutral-800/80" />,

    strong: (props) => <strong {...props} className="font-semibold text-foreground dark:text-neutral-50" />,

    a: ({ href, ...props }) => (
      <a
        {...props}
        href={href}
        className="text-amber-200/90 underline underline-offset-4 hover:text-amber-200"
        target={href?.startsWith("#") ? undefined : "_blank"}
        rel={href?.startsWith("#") ? undefined : "noreferrer"}
      />
    ),

    blockquote: ({ children, ...props }) => {
      const raw = String(getText(children) ?? "").replace(/\s+/g, " ").trim();
      const kind = detectCalloutKind(raw);

      if (!kind) {
        return (
          <blockquote
            {...props}
            className="my-4 rounded-2xl border border-border/60 bg-transparent p-4 text-foreground/85 clear-both lp-card-grad-subtle"
          >
            {renderMarkdownChildren(children)}
          </blockquote>
        );
      }

      const meta = calloutMeta(kind);

      const arr = React.Children.toArray(children);
      const first = arr[0];
      if (typeof first === "string") arr[0] = stripLeadingLabel(first, kind);

      const pillClass =
        "bg-transparent text-foreground border border-border/70 lp-card-grad-subtle dark:bg-neutral-950/40 dark:text-neutral-100 dark:border-neutral-800";

      return (
        <div className={cx("my-4 rounded-2xl border p-4 ring-1 clear-both", meta.border, meta.bg, meta.ring)}>
          <div className="mb-2 flex items-center gap-2">
            <span className={cx("inline-flex h-5 items-center rounded-full px-2 text-xs font-semibold", pillClass)}>
              {meta.label}
            </span>
          </div>

          <div className="text-sm leading-relaxed text-foreground/90 dark:text-neutral-100/90">
            {renderMarkdownChildren(arr)}
          </div>
        </div>
      );
    },

    pre: ({ className, ...props }: any) => {
      const domProps = { ...props } as Record<string, unknown>;
      delete domProps.node;
      return (
        <pre
          {...domProps}
          className={cx(
            "my-4 overflow-x-auto rounded-2xl border border-border/70 bg-transparent p-4 text-sm text-foreground/90 lp-card-grad-subtle",
            className
          )}
        />
      );
    },

    code: ({ className, children, ...props }: any) => {
      const txt = String(children ?? "");
      const isBlockCode = /language-/.test(String(className ?? "")) || /\n/.test(txt);
      const domProps = { ...props } as Record<string, unknown>;
      delete domProps.node;

      if (isBlockCode) {
        return (
          <code {...domProps} className={className}>
            {txt}
          </code>
        );
      }

      return (
        <code
          {...domProps}
          className="rounded-md border border-border/70 bg-transparent px-1.5 py-0.5 text-[0.92em] text-foreground/90 lp-card-grad-subtle"
        >
          {txt}
        </code>
      );
    },

    table: (props) => (
      <div className="my-4 w-full overflow-x-auto rounded-2xl border border-border/70 bg-transparent lp-card-grad-subtle">
        <table
          {...props}
          className="w-full table-fixed text-sm text-foreground/90 md:min-w-[720px] md:table-auto"
        />
      </div>
    ),

    th: (props) => (
      <th
        {...props}
        className="bg-transparent px-2 py-2 text-left align-top whitespace-normal break-words font-semibold text-foreground lp-card-grad-subtle md:px-3"
      />
    ),

    td: ({ children, ...props }) => (
      <td {...props} className="border-t border-border/70 px-2 py-2 align-top whitespace-normal break-words md:px-3">
        {renderMarkdownChildren(children)}
      </td>
    ),
  };

  const body = mounted ? (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>
      {normalizedSource}
    </ReactMarkdown>
  ) : null;

  const proseClass = cx(
    "prose dark:prose-invert",
    "max-w-none w-full min-w-0",
    "prose-p:leading-relaxed",
    "prose-headings:text-foreground prose-p:text-foreground/85",
    "prose-strong:text-foreground",
    "dark:prose-headings:text-neutral-50 dark:prose-p:text-neutral-100/85 dark:prose-strong:text-neutral-50",
    contentClassName
  );

  const left =
    layout === "card" ? (
      <div data-md-card className="w-full rounded-3xl border border-border/60 bg-transparent pt-4 px-6 pb-6 lp-card-grad">
        <div ref={contentRef as any} className={proseClass} lang="de">
          {body}
        </div>
      </div>
    ) : (
      <div ref={contentRef as any} className={proseClass} lang="de">
        {body}
      </div>
    );

  return (
    <div
      className={cx(
        "relative isolate w-full min-w-0",
        showToc ? "grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]" : "grid grid-cols-1 gap-6",
        className
      )}
    >
      <div className="min-w-0 relative z-0 overflow-hidden">{left}</div>

      {showToc ? (
        <aside className="hidden lg:block relative z-50 pointer-events-auto">
          <div
            className={cx(
              "rounded-3xl border border-border/60 bg-transparent overflow-hidden lp-card-grad-subtle dark:border-neutral-800 dark:bg-neutral-950/30",
              tocSticky ? "sticky top-6" : ""
            )}
          >
            <div
              ref={tocScrollRef}
              className={cx("max-h-[calc(90dvh-1.5rem)] overflow-y-auto lp-scrollbar", "p-4 pr-3 pt-5 pb-5")}
            >
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60 dark:text-neutral-300/80">
                Inhalt
              </div>

              <nav className="space-y-1 text-sm">
                {toc.map((item) => {
                  const label = item.text;
                  const id = item.id;
                  const depth = item.depth;

                  return (
                    <button
                      key={id}
                      data-toc-id={id}
                      type="button"
                      className={[
                        "pointer-events-auto block w-full rounded-lg px-2 py-1 text-left transition",
                        depth === 1
                          ? "font-semibold text-foreground/90 dark:text-neutral-100"
                          : depth === 2
                          ? "font-medium text-foreground/85 dark:text-neutral-100"
                          : "pl-4 text-foreground/70 dark:text-neutral-200/85",
                        activeId === id
                          ? "bg-primary/12 text-foreground ring-1 ring-primary/35 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/30"
                          : "text-foreground/75 hover:bg-transparent hover:lp-card-grad-subtle dark:text-neutral-200/80 dark:hover:bg-neutral-800/30",
                      ].join(" ")}
                      onClick={(e) => {
                        e.preventDefault();

                        setActiveId(id);
                        lockSpyTo(id, 750);

                        const el = document.getElementById(id) as HTMLElement | null;
                        if (!el) return;

                        const root = getScrollRoot?.();
                        const sc = (root ?? getBestScrollContainer(el)) as any;

                        scrollToTarget(sc, el, { behavior: "smooth" });

                        if (tocScrollRef.current) keepActiveTocItemVisible(tocScrollRef.current as any, id);
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
