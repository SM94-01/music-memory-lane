export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-xs";
  const pct = Math.max(0, Math.min(5, value)) / 5 * 100;
  return (
    <span className={`relative inline-block leading-none tracking-tighter ${cls}`} aria-label={`${value} of 5 stars`}>
      <span className="text-muted/20">★★★★★</span>
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
