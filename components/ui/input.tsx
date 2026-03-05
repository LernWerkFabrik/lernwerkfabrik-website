import * as React from "react";
import { cn } from "@/lib/utils";

type NumericMode = "decimal" | "integer";

type InputProps = React.ComponentProps<"input"> & {
  /** Wenn gesetzt, werden Eingaben live gefiltert (auch Paste). */
  numeric?: boolean;
  /** decimal erlaubt Komma/Punkt, integer nicht. Default: decimal */
  numericMode?: NumericMode;
  /** erlaubt ein führendes Minuszeichen */
  allowNegative?: boolean;
  /** optional: max. Nachkommastellen (nur bei decimal sinnvoll) */
  maxDecimals?: number;
};

function filterNumeric(
  raw: string,
  {
    mode,
    allowNegative,
    maxDecimals,
  }: { mode: NumericMode; allowNegative: boolean; maxDecimals?: number }
) {
  let s = raw;

  // nur diese Zeichen erlauben
  const allowed = mode === "integer" ? /[0-9-]/g : /[0-9.,-]/g;
  s = (s.match(allowed) ?? []).join("");

  // Minus nur am Anfang & nur einmal
  if (!allowNegative) {
    s = s.replace(/-/g, "");
  } else {
    s = s.replace(/(?!^)-/g, ""); // alle '-' außer am Anfang entfernen
    s = s.replace(/^--+/, "-"); // mehrere am Anfang auf eins reduzieren
  }

  if (mode === "decimal") {
    // Komma/Punkt vereinheitlichen: wir erlauben beide in der Eingabe,
    // aber erzwingen: nur ein Trennzeichen insgesamt
    const firstSep = s.search(/[.,]/);
    if (firstSep !== -1) {
      const head = s.slice(0, firstSep);
      const tail = s
        .slice(firstSep + 1)
        .replace(/[.,]/g, ""); // weitere Separatoren entfernen
      const sep = s[firstSep]; // das erste bleibt
      s = head + sep + tail;
    }

    // maxDecimals begrenzen
    if (typeof maxDecimals === "number" && maxDecimals >= 0) {
      const m = s.match(/^(-?\d+)([.,](\d*))?$/);
      if (m) {
        const intPart = m[1] ?? "";
        const sep = m[2]?.[0]; // '.' oder ','
        const decPart = m[3] ?? "";
        if (sep) {
          s = `${intPart}${sep}${decPart.slice(0, maxDecimals)}`;
        } else {
          s = intPart;
        }
      }
    }
  } else {
    // integer: alle Separatoren entfernen (falls Paste)
    s = s.replace(/[.,]/g, "");
  }

  return s;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      numeric,
      numericMode = "decimal",
      allowNegative = false,
      maxDecimals,
      inputMode,
      onChange,
      onPaste,
      ...props
    },
    ref
  ) => {
    const effectiveInputMode =
      numeric ? (numericMode === "integer" ? "numeric" : "decimal") : inputMode;

    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        inputMode={effectiveInputMode}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        onChange={(e) => {
          if (numeric) {
            const next = filterNumeric(e.target.value, {
              mode: numericMode,
              allowNegative,
              maxDecimals,
            });
            if (next !== e.target.value) e.target.value = next;
          }
          onChange?.(e);
        }}
        onPaste={(e) => {
          if (!numeric) return onPaste?.(e);

          e.preventDefault();
          const text = e.clipboardData.getData("text");
          const next = filterNumeric(text, {
            mode: numericMode,
            allowNegative,
            maxDecimals,
          });

          const el = e.currentTarget;
          const start = el.selectionStart ?? el.value.length;
          const end = el.selectionEnd ?? el.value.length;
          const merged = el.value.slice(0, start) + next + el.value.slice(end);

          const filteredMerged = filterNumeric(merged, {
            mode: numericMode,
            allowNegative,
            maxDecimals,
          });

          el.value = filteredMerged;
          el.setSelectionRange(
            Math.min(start + next.length, filteredMerged.length),
            Math.min(start + next.length, filteredMerged.length)
          );

          // feuere change damit React state aktualisiert
          const event = new Event("input", { bubbles: true });
          el.dispatchEvent(event);

          onPaste?.(e);
        }}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
