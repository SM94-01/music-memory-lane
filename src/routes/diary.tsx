import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Stars } from "@/components/Stars";
import { diary, getAlbum } from "@/data/mock";

export const Route = createFileRoute("/diary")({
  head: () => ({ meta: [{ title: "Diary — TraX" }] }),
  component: DiaryPage,
});

function DiaryPage() {
  return (
    <MobileShell>
      <section className="animate-reveal">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tighter">Diary</h1>
          <p className="text-sm text-muted mt-1">Every album, every memory.</p>
        </div>

        <div className="space-y-10 relative border-l border-border pl-6">
          {diary.map((month, mi) => (
            <div key={month.month} className="relative">
              <div className={`absolute -left-[28.5px] top-1.5 size-2 rounded-full border-2 border-background ${month.current ? "bg-accent" : "bg-border"}`} />
              <h2 className="text-[10px] font-mono text-muted uppercase tracking-widest mb-4">{month.month}</h2>
              <div className={`space-y-4 ${mi > 0 ? "opacity-70" : ""}`}>
                {month.entries.map((e) => {
                  const album = getAlbum(e.albumId)!;
                  return (
                    <Link to="/album/$id" params={{ id: album.id }} key={`${month.month}-${e.albumId}`} className="flex items-center gap-4 group">
                      <img src={album.cover} alt={album.title} loading="lazy" width={128} height={128} className="size-14 object-cover shrink-0 rounded-xs" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">{album.title}</p>
                        <p className="text-[11px] text-muted truncate">{album.artist}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Stars value={e.rating} />
                          <span className="text-[10px] font-mono text-muted">• {e.date}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}
