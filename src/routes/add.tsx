import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Search as SearchIcon, Loader2, Disc3, Mic2, Tag, ArrowLeft, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GENRES } from "@/data/mock";
import { Avatar } from "@/components/Avatar";
import { useQuery } from "@tanstack/react-query";
import { useMyProfile } from "@/lib/auth";
import { fetchTasteFingerprint } from "@/lib/taste";
import { AlbumCover } from "@/components/AlbumCover";

export const Route = createFileRoute("/add")({
  head: () => ({ meta: [{ title: "Add music — TraX" }] }),
  component: AddPage,
});

type ReleaseGroup = { id: string; title: string; "first-release-date"?: string; "primary-type"?: string; "artist-credit"?: { name: string }[]; tags?: { name: string }[] };
type Artist = { id: string; name: string; country?: string; disambiguation?: string; tags?: { name: string }[] };
type Mode = "albums" | "artists" | "genres";

function AddPage() {
  const [mode, setMode] = useState<Mode>("albums");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [albums, setAlbums] = useState<ReleaseGroup[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: me } = useMyProfile();
  const { data: taste } = useQuery({
    queryKey: ["taste", me?.id],
    enabled: !!me,
    queryFn: () => fetchTasteFingerprint(me!.id),
  });
  const myGenres = taste?.topGenres ?? [];
  const myArtists = taste?.topArtists ?? [];

  useEffect(() => { setQ(""); setSelectedGenre(null); }, [mode]);

  useEffect(() => {
    if (mode === "genres") return;
    if (!q.trim()) { setAlbums([]); setArtists([]); setError(null); return; }
    abortRef.current?.abort();
    const ctrl = new AbortController(); abortRef.current = ctrl;
    const t = setTimeout(async () => {
      setLoading(true); setError(null);
      try {
        const path = mode === "albums" ? "release-group" : "artist";
        const r = await fetch(`https://musicbrainz.org/ws/2/${path}/?query=${encodeURIComponent(q)}&fmt=json&limit=20`, { signal: ctrl.signal, headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error("Search failed");
        const j = await r.json();
        if (mode === "albums") setAlbums(rankAlbums(j["release-groups"] ?? [], myGenres, myArtists));
        else setArtists(rankArtists(j.artists ?? [], myGenres));
      } catch (e) { if ((e as Error).name !== "AbortError") setError("Couldn't reach MusicBrainz."); }
      finally { setLoading(false); }
    }, 350);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q, mode, myGenres.join("|"), myArtists.join("|")]);

  return (
    <MobileShell>
      <div className="px-5 pt-5">
        <h1 className="text-3xl font-extrabold tracking-tighter mb-1">Add music</h1>
        <p className="text-sm text-muted mb-5">Search the open MusicBrainz catalog.</p>

        {mode !== "genres" || selectedGenre === null ? (
          <label className="flex items-center gap-3 border border-border rounded-full px-4 py-3 bg-secondary/40 focus-within:border-accent">
            <SearchIcon className="size-4 text-muted shrink-0" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder={mode === "albums" ? "Search albums…" : mode === "artists" ? "Search artists…" : "Search genres…"}
              className="bg-transparent outline-none flex-1 text-sm placeholder:text-muted"
            />
            {loading && <Loader2 className="size-4 text-muted animate-spin" />}
          </label>
        ) : null}

        <div className="flex gap-1 p-1 bg-secondary/60 rounded-full mt-4">
          <ModeBtn active={mode === "albums"} onClick={() => setMode("albums")} icon={<Disc3 className="size-3.5" />}>Albums</ModeBtn>
          <ModeBtn active={mode === "artists"} onClick={() => setMode("artists")} icon={<Mic2 className="size-3.5" />}>Artists</ModeBtn>
          <ModeBtn active={mode === "genres"} onClick={() => setMode("genres")} icon={<Tag className="size-3.5" />}>Genres</ModeBtn>
        </div>
      </div>

      <div className="px-5 mt-6">
        {error && <p className="text-xs text-destructive">{error}</p>}

        {mode === "albums" && (q ? <AlbumResults items={albums} empty={!loading} /> : <SuggestedFeed kind="albums" genres={myGenres} />)}
        {mode === "artists" && (q ? <ArtistResults items={artists} empty={!loading} /> : <SuggestedFeed kind="artists" genres={myGenres} />)}
        {mode === "genres" && (
          selectedGenre ? <GenreView genre={selectedGenre} onBack={() => setSelectedGenre(null)} />
          : <GenresList query={q} onPick={setSelectedGenre} topGenres={myGenres} />
        )}
      </div>
    </MobileShell>
  );
}

function rankAlbums(items: ReleaseGroup[], genres: string[], artists: string[]) {
  if (!genres.length && !artists.length) return items;
  const score = (it: ReleaseGroup) => {
    let s = 0;
    const tags = (it.tags ?? []).map((t) => t.name.toLowerCase());
    if (tags.some((t) => genres.includes(t))) s += 2;
    const artist = (it["artist-credit"]?.[0]?.name ?? "").toLowerCase();
    if (artists.includes(artist)) s += 3;
    return s;
  };
  return [...items].sort((a, b) => score(b) - score(a));
}
function rankArtists(items: Artist[], genres: string[]) {
  if (!genres.length) return items;
  const score = (it: Artist) => {
    const tags = (it.tags ?? []).map((t) => t.name.toLowerCase());
    return tags.some((t) => genres.includes(t)) ? 2 : 0;
  };
  return [...items].sort((a, b) => score(b) - score(a));
}

function SuggestedFeed({ kind, genres }: { kind: "albums" | "artists"; genres: string[] }) {
  const enabled = genres.length > 0;
  const { data, isLoading } = useQuery({
    queryKey: ["suggested-mb", kind, genres.join("|")],
    enabled,
    queryFn: async () => {
      const tagQuery = genres.slice(0, 3).map((g) => `tag:"${g}"`).join(" OR ");
      const path = kind === "albums" ? "release-group" : "artist";
      const r = await fetch(`https://musicbrainz.org/ws/2/${path}/?query=${encodeURIComponent(tagQuery)}&fmt=json&limit=20`, { headers: { Accept: "application/json" } });
      const j = await r.json();
      if (kind === "albums") return (j["release-groups"] ?? []) as ReleaseGroup[];
      return (j.artists ?? []) as Artist[];
    },
  });

  if (!enabled) {
    return (
      <p className="text-sm text-muted leading-relaxed mt-8">
        Log a few albums and we'll start suggesting {kind} that match your taste. For now, search anything above.
      </p>
    );
  }
  if (isLoading) return <div className="py-6 flex justify-center"><Loader2 className="size-5 animate-spin text-muted" /></div>;
  return kind === "albums"
    ? <AlbumResults items={(data as ReleaseGroup[]) ?? []} empty={false} />
    : <ArtistResults items={(data as Artist[]) ?? []} empty={false} />;
}

function AlbumResults({ items, empty }: { items: ReleaseGroup[]; empty: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((a) => {
        const artist = a["artist-credit"]?.map((c) => c.name).join(", ") ?? "Unknown";
        const year = a["first-release-date"]?.slice(0, 4);
        const cover = `https://coverartarchive.org/release-group/${a.id}/front-250`;
        return (
          <li key={a.id}>
            <Link to="/album/$id" params={{ id: a.id }} className="py-3 flex items-center gap-4">
              <div className="size-14 shrink-0 rounded-xs overflow-hidden bg-secondary [container-type:inline-size]">
                <AlbumCover src={cover} title={a.title} artist={artist} className="size-full" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{a.title}</p>
                <p className="text-[11px] text-muted truncate">
                  {artist}{year ? ` • ${year}` : ""}{a["primary-type"] ? ` • ${a["primary-type"]}` : ""}
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-accent">Open →</span>
            </Link>
          </li>
        );
      })}
      {empty && items.length === 0 && <li className="py-6 text-sm text-muted">No albums found.</li>}
    </ul>
  );
}

function ArtistResults({ items, empty }: { items: Artist[]; empty: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((a) => (
        <li key={a.id}>
          <Link to="/artist/$id" params={{ id: a.id }} className="py-3 flex items-center gap-4">
            <Avatar handle={a.id} name={a.name} size={56} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{a.name}</p>
              <p className="text-[11px] text-muted truncate">{a.disambiguation || a.country || "Artist"}</p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-accent">Open →</span>
          </Link>
        </li>
      ))}
      {empty && items.length === 0 && <li className="py-6 text-sm text-muted">No artists found.</li>}
    </ul>
  );
}

function GenresList({ query, onPick, topGenres }: { query: string; onPick: (g: string) => void; topGenres: string[] }) {
  const filtered = useMemo(() => {
    const sorted = [...GENRES].sort();
    if (!query.trim()) return sorted;
    const q = query.toLowerCase();
    return sorted.filter((g) => g.toLowerCase().includes(q));
  }, [query]);
  return (
    <div>
      <ul className="divide-y divide-border">

        {filtered.map((g) => (
          <li key={g}>
            <button onClick={() => onPick(g)} className="w-full py-3 flex items-center justify-between text-left">
              <span className="text-sm font-bold">{g}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted">Explore →</span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <li className="py-6 text-sm text-muted">No genre matches.</li>}
      </ul>
    </div>
  );
}

function GenreView({ genre, onBack }: { genre: string; onBack: () => void }) {
  const [albums, setAlbums] = useState<ReleaseGroup[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const tag = encodeURIComponent(genre.toLowerCase());
    Promise.all([
      fetch(`https://musicbrainz.org/ws/2/release-group/?query=tag:${tag}&fmt=json&limit=12`, { headers: { Accept: "application/json" } }).then((r) => r.json()),
      fetch(`https://musicbrainz.org/ws/2/artist/?query=tag:${tag}&fmt=json&limit=8`, { headers: { Accept: "application/json" } }).then((r) => r.json()),
    ]).then(([rg, ar]) => {
      setAlbums(rg["release-groups"] ?? []);
      setArtists(ar.artists ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [genre]);

  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted mb-4 hover:text-foreground">
        <ArrowLeft className="size-3" /> All genres
      </button>
      <h2 className="text-2xl font-extrabold tracking-tighter mb-1">{genre}</h2>
      <p className="text-xs text-muted mb-6">Most popular in this genre</p>

      {loading ? <Loader2 className="size-5 animate-spin text-muted mx-auto" /> : (
        <>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Top artists</h3>
          <ul className="divide-y divide-border mb-6">
            {artists.slice(0, 6).map((a) => (
              <li key={a.id}>
                <Link to="/artist/$id" params={{ id: a.id }} className="py-2.5 flex items-center gap-3">
                  <Avatar handle={a.id} name={a.name} size={36} />
                  <span className="text-sm font-bold flex-1 truncate">{a.name}</span>
                  <span className="text-[10px] font-mono text-muted">→</span>
                </Link>
              </li>
            ))}
          </ul>

          <h3 className="text-[10px] font-mono uppercase tracking-widest text-accent mb-3">Top albums</h3>
          <div className="grid grid-cols-2 gap-3">
            {albums.map((a) => {
              const cover = `https://coverartarchive.org/release-group/${a.id}/front-250`;
              const artist = a["artist-credit"]?.map((c) => c.name).join(", ") ?? "";
              return (
                <Link to="/album/$id" params={{ id: a.id }} key={a.id}>
                  <img src={cover} alt="" loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                    className="aspect-square w-full object-cover rounded-xs bg-secondary" />
                  <p className="text-xs font-bold mt-2 truncate">{a.title}</p>
                  <p className="text-[10px] text-muted truncate">{artist}</p>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ModeBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all ${active ? "bg-foreground text-background" : "text-muted"}`}>
      {icon}{children}
    </button>
  );
}
