import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Search as SearchIcon, Loader2, Disc3, Mic2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/add")({
  head: () => ({ meta: [{ title: "Add music — TraX" }] }),
  component: AddPage,
});

type ReleaseGroup = {
  id: string;
  title: string;
  "first-release-date"?: string;
  "primary-type"?: string;
  "artist-credit"?: { name: string }[];
};
type Artist = { id: string; name: string; country?: string; disambiguation?: string };

type Mode = "albums" | "artists";

function AddPage() {
  const [mode, setMode] = useState<Mode>("albums");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState<ReleaseGroup[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setAlbums([]); setArtists([]); setError(null); return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const t = setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        if (mode === "albums") {
          const url = `https://musicbrainz.org/ws/2/release-group/?query=${encodeURIComponent(q)}&fmt=json&limit=20`;
          const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
          if (!r.ok) throw new Error("Search failed");
          const j = await r.json();
          setAlbums(j["release-groups"] ?? []);
        } else {
          const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(q)}&fmt=json&limit=20`;
          const r = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
          if (!r.ok) throw new Error("Search failed");
          const j = await r.json();
          setArtists(j.artists ?? []);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Couldn't reach MusicBrainz. Try again.");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, mode]);

  return (
    <MobileShell>
      <div className="px-5 pt-5">
        <h1 className="text-3xl font-extrabold tracking-tighter mb-1">Add music</h1>
        <p className="text-sm text-muted mb-5">Search the MusicBrainz catalog.</p>

        <label className="flex items-center gap-3 border border-border rounded-full px-4 py-3 bg-secondary/40 focus-within:border-accent transition-colors">
          <SearchIcon className="size-4 text-muted shrink-0" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={mode === "albums" ? "Search albums…" : "Search artists…"}
            className="bg-transparent outline-none flex-1 text-sm placeholder:text-muted"
          />
          {loading && <Loader2 className="size-4 text-muted animate-spin" />}
        </label>

        <div className="flex gap-1 p-1 bg-secondary/60 rounded-full mt-4">
          <ModeBtn active={mode === "albums"} onClick={() => setMode("albums")} icon={<Disc3 className="size-3.5" />}>Albums</ModeBtn>
          <ModeBtn active={mode === "artists"} onClick={() => setMode("artists")} icon={<Mic2 className="size-3.5" />}>Artists</ModeBtn>
        </div>
      </div>

      <div className="px-5 mt-6">
        {error && <p className="text-xs text-destructive">{error}</p>}
        {!q && !loading && (
          <p className="text-sm text-muted leading-relaxed mt-8">
            Find any album or artist from the open MusicBrainz database. Tap a result to log it, rate it, or save it for later.
          </p>
        )}

        {mode === "albums" && (
          <ul className="divide-y divide-border">
            {albums.map((a) => {
              const artist = a["artist-credit"]?.map((c) => c.name).join(", ") ?? "Unknown";
              const year = a["first-release-date"]?.slice(0, 4);
              const cover = `https://coverartarchive.org/release-group/${a.id}/front-250`;
              return (
                <li key={a.id} className="py-3 flex items-center gap-4">
                  <img
                    src={cover}
                    alt=""
                    loading="lazy"
                    width={56}
                    height={56}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
                    className="size-14 object-cover rounded-xs shrink-0 bg-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{a.title}</p>
                    <p className="text-[11px] text-muted truncate">
                      {artist}{year ? ` • ${year}` : ""}{a["primary-type"] ? ` • ${a["primary-type"]}` : ""}
                    </p>
                  </div>
                  <button className="text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 bg-foreground text-background rounded-full">
                    Add
                  </button>
                </li>
              );
            })}
            {q && !loading && albums.length === 0 && !error && <li className="py-6 text-sm text-muted">No albums found.</li>}
          </ul>
        )}

        {mode === "artists" && (
          <ul className="divide-y divide-border">
            {artists.map((a) => (
              <li key={a.id} className="py-3 flex items-center gap-4">
                <div className="size-14 rounded-full bg-secondary grid place-items-center shrink-0">
                  <Mic2 className="size-5 text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{a.name}</p>
                  <p className="text-[11px] text-muted truncate">
                    {a.disambiguation || a.country || "Artist"}
                  </p>
                </div>
                <button className="text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 border border-border rounded-full">
                  Follow
                </button>
              </li>
            ))}
            {q && !loading && artists.length === 0 && !error && <li className="py-6 text-sm text-muted">No artists found.</li>}
          </ul>
        )}
      </div>
    </MobileShell>
  );
}

function ModeBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all ${
        active ? "bg-foreground text-background" : "text-muted"
      }`}
    >
      {icon}{children}
    </button>
  );
}
