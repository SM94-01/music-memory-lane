export function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const full = Math.round(value);
  const cls = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-xs";
  return (
    <span className={`inline-flex tracking-tighter text-accent ${cls}`} aria-label={`${value} of 5 stars`}>
      {"★".repeat(full)}
      <span className="text-muted/20">{"★".repeat(5 - full)}</span>
    </span>
  );
}
