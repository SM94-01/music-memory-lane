import { useRef } from "react";
import { Camera } from "lucide-react";

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
  onUpload,
  uploading = false,
}: {
  handle: string;
  name?: string | null;
  url?: string | null;
  size?: number;
  ring?: boolean;
  onUpload?: (file: File) => void;
  uploading?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const h = hashHue(handle || "x");
  const bg = `linear-gradient(135deg, hsl(${h} 70% 45%), hsl(${(h + 60) % 360} 70% 30%))`;
  const initial = (name || handle || "?").charAt(0).toUpperCase();
  const wrapCls = ring ? "p-[2px] bg-gradient-to-br from-accent via-accent/40 to-secondary rounded-full" : "";

  const inner = (
    <div
      style={{ width: size, height: size, background: url ? undefined : bg }}
      className="relative rounded-full grid place-items-center overflow-hidden text-background font-extrabold shrink-0"
    >
      {url ? (
        <img src={url} alt={name || handle} width={size} height={size} className="size-full object-cover" />
      ) : (
        <span style={{ fontSize: size * 0.42 }}>{initial}</span>
      )}
      {onUpload && (
        <div className="absolute inset-0 bg-black/40 grid place-items-center opacity-0 hover:opacity-100 transition-opacity">
          <Camera className="size-1/3 text-white" />
        </div>
      )}
      {uploading && (
        <div className="absolute inset-0 bg-black/60 grid place-items-center">
          <span className="text-[10px] text-white font-mono">…</span>
        </div>
      )}
    </div>
  );

  if (onUpload) {
    return (
      <button type="button" onClick={() => fileRef.current?.click()} className={wrapCls || undefined} aria-label="Change avatar">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = "";
          }}
        />
        {inner}
      </button>
    );
  }

  if (ring) return <div className={wrapCls}>{inner}</div>;
  return inner;
}
