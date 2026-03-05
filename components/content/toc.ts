export type TocItem = { depth: 1 | 2 | 3 | 4; text: string; id: string };

function depthFromTag(tag: string): 1 | 2 | 3 | 4 | null {
  if (tag === "h1") return 1;
  if (tag === "h2") return 2;
  if (tag === "h3") return 3;
  if (tag === "h4") return 4;
  return null;
}

function isNumberedChapter(text: string): boolean {
  // Examples: "1) ...", "6. ...", "10) ..."
  return /^\d+([.)])\s*/.test(text.trim());
}

export function getTocHeadingNodes(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];

  const nodes = Array.from(root.querySelectorAll<HTMLElement>("h1[id], h2[id], h3[id], h4[id]"));

  return nodes.filter((el) => {
    const depth = depthFromTag(el.tagName.toLowerCase());
    if (!depth) return false;

    const id = el.id?.trim();
    const text = (el.textContent || "").trim();
    if (!id || !text) return false;

    // Keep numbered H1 chapter headings, skip plain document title H1.
    if (depth === 1 && !isNumberedChapter(text)) return false;

    return true;
  });
}

export function buildTocFromRoot(root: HTMLElement | null): TocItem[] {
  const nodes = getTocHeadingNodes(root);
  const items: TocItem[] = [];

  for (const el of nodes) {
    const depth = depthFromTag(el.tagName.toLowerCase());
    if (!depth) continue;

    items.push({
      depth,
      id: el.id.trim(),
      text: (el.textContent || "").trim(),
    });
  }

  return items;
}

/**
 * Hält den aktiven TOC-Eintrag im sichtbaren Bereich des TOC-Scrollcontainers.
 */
export function keepActiveTocItemVisible(tocScrollEl: HTMLElement | null, activeId: string | null) {
  if (!tocScrollEl || !activeId) return;

  const btn = tocScrollEl.querySelector<HTMLButtonElement>(`button[data-toc-id="${activeId}"]`);
  if (!btn) return;

  const elTop = btn.offsetTop;
  const elBottom = elTop + btn.offsetHeight;
  const viewTop = tocScrollEl.scrollTop;
  const viewBottom = viewTop + tocScrollEl.clientHeight;

  if (elTop < viewTop + 12) {
    tocScrollEl.scrollTo({ top: Math.max(0, elTop - 12), behavior: "smooth" });
  } else if (elBottom > viewBottom - 12) {
    tocScrollEl.scrollTo({ top: elBottom - tocScrollEl.clientHeight + 12, behavior: "smooth" });
  }
}
