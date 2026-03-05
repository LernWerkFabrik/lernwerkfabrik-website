// components/learn/TextAnswerField.tsx
"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Field = {
  key: string;
  label: string;
  minWords?: number;
  maxWords?: number;
};

export type TextAnswerFieldProps = {
  fields: Field[];
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;

  disabled?: boolean;

  // Optional: show simple word counters (useful in Vorbereitung)
  showWordCount?: boolean;

  // Optional: show evaluation feedback (passed/points/checklist)
  feedback?: {
    summary?: string;
    checklist?: string[];
  };
};

function countWords(text: string) {
  const t = (text ?? "").trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

export default function TextAnswerField(props: TextAnswerFieldProps) {
  const { fields, value, onChange, disabled, showWordCount, feedback } = props;

  return (
    <div className="space-y-4">
      {fields.map((f) => {
        const v = value?.[f.key] ?? "";
        const wc = countWords(v);

        return (
          <div key={f.key} className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label className="text-sm">{f.label}</Label>
              {showWordCount ? (
                <div className="text-xs text-muted-foreground">
                  {wc} Wörter
                  {typeof f.minWords === "number" ? ` · min ${f.minWords}` : ""}
                </div>
              ) : null}
            </div>

            <Textarea
              value={v}
              disabled={disabled}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
              className="min-h-[96px]"
              placeholder="Kurz und prüfungstauglich schreiben…"
            />
          </div>
        );
      })}

      {feedback ? (
        <>
          <Separator />
          <div className="space-y-2">
            {feedback.summary ? (
              <div className="text-sm">{feedback.summary}</div>
            ) : null}

            {feedback.checklist && feedback.checklist.length > 0 ? (
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {feedback.checklist.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
