"use client";

export default function QuestionDot({
  tone,
}: {
  tone: "green" | "red" | "gold";
}) {
  const cls =
    tone === "green"
      ? "bg-emerald-500"
      : tone === "red"
      ? "bg-rose-500"
      : "bg-amber-400";

  return (
    <span
      className={[
        "absolute -top-[8%] -right-[8%] md:-top-1 md:-right-1",
        "h-[34%] w-[34%] min-h-[14px] min-w-[14px] max-h-[18px] max-w-[18px] rounded-full md:h-3.5 md:w-3.5",
        cls,
        "ring-2 ring-background",
      ].join(" ")}
      aria-hidden="true"
    />
  );
}
