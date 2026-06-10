import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Stars } from "@/components/Stars";
import { albums } from "@/data/mock";
import { Search as SearchIcon } from "lucide-react";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Explore — TraX" }] }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return albums;
    return albums.filter((a) => a.title.toLowerCase().includes(s) || a.artist.toLowerCase().includes(s) || a.genre.toLowerCase().includes(s));
  }, [q]);
  const trending = [...albums].sort((a, b) => b.avgRating - a.avgRating).slice(0, 4);

  return (
    <MobileShell>
      <section className="animate-reveal">
        <h1 className="text-3xl font-extrabold tracking-tighter mb-1">Explore</h1>
        <p className="text-sm text-muted mb-6">Discovery through friends, not algorithms.</p>

        <label className="flex items-center gap-3 border border-border rounded-sm px-3 py-2.5 bg-secondary/40 focus-within:border-accent transition-colors">
          <SearchIcon className="size-4 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search albums, artists, genres"
            className="bg-transparent outline-none flex-1 text-sm placeholder:text-muted"
          />
        </label>

        {!q && (
          <div className="mt-10">
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-4">Trending This Week</h2>
            <div className="grid grid-cols-2 gap-3">
              {trending.map((a) => (
                <Link to="/album/$id" params={{ id: a.id }} key={a.id} className="group">
                  <img src={a.cover} alt={a.title} loading="lazy" width={400} height={400} className="aspect-square w-full object-cover rounded-xs" />
                  <p className="text-xs font-bold mt-2 truncate">{a.title}</p>
                  <p className="text-[10px] text-muted truncate">{a.artist}</p>
                  <div className="mt-1"><Stars value={a.avgRating} /></div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-accent">
            {q ? `${filtered.length} results` : "All Albums"}
          </h2>
          {filtered.map((a) => (
            <Link to="/album/$id" params={{ id: a.id }} key={a.id} className="flex items-center gap-4 group">
              <img src={a.cover} alt={a.title} loading="lazy" width={128} height={128} className="size-14 object-cover shrink-0 rounded-xs" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate group-hover:text-accent transition-colors">{a.title}</p>
                <p className="text-[11px] text-muted truncate">{a.artist} • {a.year}</p>
              </div>
              <span className="font-mono text-xs text-muted">{a.avgRating.toFixed(1)}</span>
            </Link>
          ))}
        </div>
      </section>
    </MobileShell>
  );
}
