export function Stars({ value, size = "sm" }: { value: number | string; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "text-2xl" : size === "md" ? "text-base" : "text-xs";
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className={`inline-flex items-center leading-none ${cls}`} aria-label={`${v} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, v - (star - 1))) * 100;
        return (
          <span key={star} className="relative inline-block w-[1em] overflow-hidden" aria-hidden>
            <span className="text-foreground opacity-20">★</span>
            <span className="absolute inset-0 overflow-hidden text-accent" style={{ width: `${fill}%` }}>
              ★
            </span>
          </span>
        );
      })}
    </span>
  );
}
