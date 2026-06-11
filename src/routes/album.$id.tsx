import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Stars } from "@/components/Stars";
import { Avatar } from "@/components/Avatar";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Bookmark, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMockAlbum, mockCoverFor } from "@/data/mock";

type AlbumInfo = { title: string; artist: string; year: number | null; cover: string | null; genre: string | null };

export const Route = createFileRoute("/album/$id")({
  component: AlbumPage,
});

function AlbumPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { data: me } = useMyProfile();
  const qc = useQueryClient();
  const [info, setInfo] = useState<AlbumInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [logged, setLogged] = useState(false);
  const [myLogId, setMyLogId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Resolve album info: mock first, then DB log, then MusicBrainz
  useEffect(() => {
    (async () => {
      const mock = getMockAlbum(id);
      if (mock) {
        setInfo({ title: mock.title, artist: mock.artist, year: mock.year, cover: mockCoverFor(id) ?? null, genre: mock.genre });
        setLoading(false); return;
      }
      const { data: anyLog } = await supabase
        .from("album_logs").select("title, artist, year, cover_url, genre")
        .eq("album_key", id).limit(1).maybeSingle();
      if (anyLog) {
        setInfo({ title: anyLog.title, artist: anyLog.artist, year: anyLog.year, cover: anyLog.cover_url, genre: anyLog.genre });
        setLoading(false); return;
      }
      // Try MusicBrainz
      try {
        const r = await fetch(`https://musicbrainz.org/ws/2/release-group/${id}?fmt=json&inc=artist-credits+tags`, { headers: { Accept: "application/json" } });
        if (r.ok) {
          const j = await r.json();
          setInfo({
            title: j.title,
            artist: j["artist-credit"]?.map((c: any) => c.name).join(", ") ?? "Unknown",
            year: j["first-release-date"]?.slice(0, 4) ? Number(j["first-release-date"].slice(0, 4)) : null,
            cover: `https://coverartarchive.org/release-group/${id}/front-250`,
            genre: j.tags?.[0]?.name ?? null,
          });
        }
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  // Load my log
  useEffect(() => {
    if (!me) return;
    supabase.from("album_logs").select("id, rating, review").eq("user_id", me.id).eq("album_key", id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMyLogId(data.id);
          setRating(data.rating ?? 0);
          setReview(data.review ?? "");
          setLogged(true);
        }
      });
  }, [me, id]);

  const { data: reviews } = useQuery({
    queryKey: ["albumReviews", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("album_logs")
        .select("id, rating, review, listened_at, user:profiles!album_logs_user_id_fkey(handle, name, avatar_url)")
        .eq("album_key", id).not("review", "is", null)
        .order("listened_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  async function saveLog() {
    if (!me || !info) return;
    setSaving(true);
    const payload = {
      user_id: me.id, album_key: id, title: info.title, artist: info.artist,
      year: info.year, cover_url: info.cover, genre: info.genre,
      rating: rating || null, review: review || null,
    };
    if (myLogId) {
      await supabase.from("album_logs").update(payload).eq("id", myLogId);
    } else {
      const { data } = await supabase.from("album_logs").insert(payload).select("id").single();
      if (data) setMyLogId(data.id);
      setLogged(true);
    }
    setSaving(false);
    qc.invalidateQueries();
  }

  async function unlog() {
    if (!myLogId) return;
    await supabase.from("album_logs").delete().eq("id", myLogId);
    setMyLogId(null); setLogged(false); setRating(0); setReview("");
    qc.invalidateQueries();
  }

  if (loading) {
    return <MobileShell><div className="px-5 py-12 flex justify-center"><Loader2 className="size-5 animate-spin text-muted" /></div></MobileShell>;
  }
  if (!info) {
    return <MobileShell><p className="px-5 text-sm text-muted">Album not found.</p></MobileShell>;
  }

  return (
    <MobileShell>
      <div className="px-5 pt-3">
        <button onClick={() => router.history.back()} className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted mb-4 hover:text-foreground">
          <ArrowLeft className="size-3" /> Back
        </button>

        <section>
          <div className="relative aspect-square mb-6 overflow-hidden rounded-sm bg-secondary">
            {info.cover ? (
              <img src={info.cover} alt={info.title} className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tighter text-pretty">{info.title}</h1>
            <p className="text-lg font-medium text-muted">{info.artist}{info.year ? ` • ${info.year}` : ""}</p>
            {info.genre && (
              <span className="mt-2 inline-block w-fit px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono uppercase">{info.genre}</span>
            )}
          </div>

          <div className="py-6 border-y border-border my-6">
            <div className="flex items-center justify-center gap-2 text-3xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} className={n <= rating ? "text-accent" : "text-muted/20"}>★</button>
              ))}
            </div>
            <p className="text-center text-[9px] text-muted uppercase tracking-widest mt-1">Your rating</p>
          </div>

          <textarea
            value={review} onChange={(e) => setReview(e.target.value)}
            placeholder="Write a review (optional)…" rows={3}
            className="w-full bg-secondary/40 border border-border rounded-sm px-3 py-2 text-sm outline-none focus:border-accent resize-none mb-3"
          />

          <div className="grid grid-cols-2 gap-3">
            <button onClick={saveLog} disabled={saving} className="py-3 font-bold text-sm rounded-sm bg-accent text-accent-foreground flex items-center justify-center gap-2 disabled:opacity-50">
              {saving ? <Loader2 className="size-4 animate-spin" /> : (logged && <Check className="size-4" />)}
              {logged ? "Update log" : "Log listen"}
            </button>
            {logged ? (
              <button onClick={unlog} className="py-3 font-bold text-sm rounded-sm border border-border text-muted">Remove</button>
            ) : (
              <button className="py-3 font-bold text-sm rounded-sm border border-border flex items-center justify-center gap-2 text-muted">
                <Bookmark className="size-4" /> To listen
              </button>
            )}
          </div>

          <div className="mt-10">
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-4">Community reviews</h2>
            <div className="space-y-6">
              {(!reviews || reviews.length === 0) && <p className="text-sm text-muted">No reviews yet.</p>}
              {reviews?.map((r: any) => (
                <div key={r.id} className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Link to="/u/$handle" params={{ handle: r.user?.handle ?? "" }} className="flex items-center gap-2">
                      <Avatar handle={r.user?.handle ?? ""} name={r.user?.name} url={r.user?.avatar_url} size={24} />
                      <span className="text-sm font-bold">{r.user?.name}</span>
                    </Link>
                    {r.rating && <Stars value={r.rating} />}
                  </div>
                  <p className="text-sm text-muted leading-relaxed">{r.review}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
