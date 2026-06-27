import { useEffect, useState } from "react";

export function AlbumCover({
  src,
  title,
  artist,
  className = "",
}: {
  src?: string | null;
  title: string;
  artist?: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const seed = (title || artist || "?").charCodeAt(0) + (artist?.charCodeAt(0) ?? 0);
  const hue = (seed * 47) % 360;

  if (!src || failed) {
    return (
      <div
        className={`${className} relative overflow-hidden grid place-items-center text-center`}
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 55% 32%), hsl(${(hue + 60) % 360} 55% 16%))`,
        }}
        aria-label={title}
      >
        <div className="px-2 py-1">
          <p className="font-extrabold tracking-tight text-white/95 leading-tight text-[clamp(0.75rem,4cqw,1.25rem)] line-clamp-3">
            {title}
          </p>
          {artist ? (
            <p className="mt-1 text-white/60 text-[clamp(0.55rem,2.5cqw,0.7rem)] font-mono uppercase tracking-widest line-clamp-1">
              {artist}
            </p>
          ) : null}
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={title}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} object-cover`}
    />
  );
}
