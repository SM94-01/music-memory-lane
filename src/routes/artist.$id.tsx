import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Avatar } from "@/components/Avatar";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

type ArtistInfo = {
  id: string; name: string; country?: string; disambiguation?: string;
  "life-span"?: { begin?: string; end?: string };
  tags?: { name: string; count: number }[];
  "release-groups"?: { id: string; title: string; "first-release-date"?: string; "primary-type"?: string }[];
};

export const Route = createFileRoute("/artist/$id")({
  head: () => ({ meta: [{ title: "Artist — TraX" }] }),
  component: ArtistPage,
});

function ArtistPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const [info, setInfo] = useState<ArtistInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`https://musicbrainz.org/ws/2/artist/${id}?fmt=json&inc=tags+release-groups`, { headers: { Accept: "application/json" } });
        if (r.ok) setInfo(await r.json());
      } finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <MobileShell><div className="px-5 py-12 flex justify-center"><Loader2 className="size-5 animate-spin text-muted" /></div></MobileShell>;
  if (!info) return <MobileShell><p className="px-5 text-sm text-muted">Artist not found.</p></MobileShell>;

  const albums = (info["release-groups"] ?? []).filter((r) => r["primary-type"] === "Album").sort((a, b) => (b["first-release-date"] ?? "").localeCompare(a["first-release-date"] ?? ""));
  const topTags = (info.tags ?? []).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <MobileShell>
      <div className="px-5 pt-3">
        <button onClick={() => router.history.back()} className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted mb-4 hover:text-foreground">
          <ArrowLeft className="size-3" /> Back
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <Avatar handle={info.id} name={info.name} size={120} ring />
          <h1 className="text-3xl font-extrabold tracking-tighter mt-4">{info.name}</h1>
          <p className="text-sm text-muted">
            {info.disambiguation || "Artist"}
            {info.country ? ` • ${info.country}` : ""}
            {info["life-span"]?.begin ? ` • ${info["life-span"].begin.slice(0, 4)}${info["life-span"].end ? `–${info["life-span"].end.slice(0, 4)}` : ""}` : ""}
          </p>
        </div>

        {topTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {topTags.map((t) => (
              <span key={t.name} className="px-2 py-0.5 bg-secondary text-[10px] font-mono uppercase tracking-widest">{t.name}</span>
            ))}
          </div>
        )}

        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-3">Albums</h2>
        <div className="grid grid-cols-2 gap-3">
          {albums.slice(0, 30).map((a) => {
            const cover = `https://coverartarchive.org/release-group/${a.id}/front-250`;
            return (
              <Link to="/album/$id" params={{ id: a.id }} key={a.id}>
                <img src={cover} alt="" loading="lazy"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                  className="aspect-square w-full object-cover rounded-xs bg-secondary" />
                <p className="text-xs font-bold mt-2 truncate">{a.title}</p>
                <p className="text-[10px] text-muted">{a["first-release-date"]?.slice(0, 4)}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </MobileShell>
  );
}
