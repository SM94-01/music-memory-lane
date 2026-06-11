function hashHue(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

export function Avatar({
  handle,
  name,
  url,
  size = 40,
  ring = false,
}: {
  handle: string;
  name?: string | null;
  url?: string | null;
  size?: number;
  ring?: boolean;
}) {
  const h = hashHue(handle || "x");
  const bg = `linear-gradient(135deg, hsl(${h} 70% 45%), hsl(${(h + 60) % 360} 70% 30%))`;
  const initial = (name || handle || "?").charAt(0).toUpperCase();
  const wrapCls = ring ? "p-[2px] bg-gradient-to-br from-accent via-accent/40 to-secondary rounded-full" : "";
  const inner = (
    <div
      style={{ width: size, height: size, background: url ? undefined : bg }}
      className="rounded-full grid place-items-center overflow-hidden text-background font-extrabold shrink-0"
    >
      {url ? (
        <img src={url} alt={name || handle} width={size} height={size} className="size-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.42 }}>{initial}</span>
      )}
    </div>
  );
  if (ring) return <div className={wrapCls}>{inner}</div>;
  return inner;
}
