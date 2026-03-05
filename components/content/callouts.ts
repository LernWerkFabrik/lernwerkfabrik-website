export type CalloutKind = "merksatz" | "tipp" | "achtung" | "wichtig" | "beispiel" | "hinweis";

export function detectCalloutKind(text: string): CalloutKind | null {
  const t = text.trim().toLowerCase();
  if (t.startsWith("merksatz:")) return "merksatz";
  if (t.startsWith("tipp:")) return "tipp";
  if (t.startsWith("achtung:")) return "achtung";
  if (t.startsWith("wichtig:")) return "wichtig";
  if (t.startsWith("beispiel:")) return "beispiel";
  if (t.startsWith("hinweis:")) return "hinweis";
  return null;
}

export function calloutMeta(kind: CalloutKind) {
  switch (kind) {
    case "merksatz":
      return { label: "Merksatz", ring: "ring-amber-500/30", border: "border-amber-500/30", bg: "bg-amber-500/10" };
    case "tipp":
      return { label: "Tipp", ring: "ring-emerald-500/25", border: "border-emerald-500/30", bg: "bg-emerald-500/10" };
    case "achtung":
      return { label: "Achtung", ring: "ring-rose-500/25", border: "border-rose-500/30", bg: "bg-rose-500/10" };
    case "wichtig":
      return { label: "Wichtig", ring: "ring-sky-500/25", border: "border-sky-500/30", bg: "bg-sky-500/10" };
    case "beispiel":
      return { label: "Beispiel", ring: "ring-violet-500/25", border: "border-violet-500/30", bg: "bg-violet-500/10" };
    case "hinweis":
    default:
      return { label: "Hinweis", ring: "ring-neutral-500/20", border: "border-neutral-700", bg: "bg-neutral-900/40" };
  }
}

export function stripLeadingLabel(raw: string, kind: CalloutKind) {
  const label = kind + ":";
  const lower = raw.trim().toLowerCase();
  if (!lower.startsWith(label)) return raw;
  return raw.trim().slice(label.length).trim();
}
