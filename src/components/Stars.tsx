export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-xs";
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const pct = (v / 5) * 100;
  return (
    <span className={`relative inline-block leading-none tracking-tighter ${cls}`} aria-label={`${v} of 5 stars`}>
      <span className="text-foreground opacity-20">★★★★★</span>
      <span
        className="absolute inset-0 overflow-hidden text-accent whitespace-nowrap"
        style={{ width: `${pct}%` }}
        aria-hidden
      >
        ★★★★★
      </span>
    </span>
  );
}
