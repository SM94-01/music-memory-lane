import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Stars } from "@/components/Stars";
import { Avatar } from "@/components/Avatar";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Bookmark, BookmarkCheck, Loader2, Send, Music2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMockAlbum, mockCoverFor } from "@/data/mock";
import { AlbumCover } from "@/components/AlbumCover";
import { ShareAlbumDialog } from "@/components/ShareAlbumDialog";
import { getSpotifyAlbum, type SpotifyTrack } from "@/lib/spotify";

type AlbumInfo = { title: string; artist: string; year: number | null; cover: string | null; genre: string | null; tracks?: SpotifyTrack[] };

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
  const [watchId, setWatchId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [bestTrack, setBestTrack] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!me) return;
    supabase.from("watchlist").select("id").eq("user_id", me.id).eq("album_key", id).maybeSingle()
      .then(({ data }) => setWatchId(data?.id ?? null));
  }, [me, id]);

  async function toggleWatch() {
    if (!me || !info) return;
    if (watchId) {
      await supabase.from("watchlist").delete().eq("id", watchId);
      setWatchId(null);
    } else {
      const { data } = await supabase.from("watchlist").insert({
        user_id: me.id, album_key: id, title: info.title, artist: info.artist,
        year: info.year, cover_url: info.cover, genre: info.genre,
      }).select("id").single();
      if (data) setWatchId(data.id);
    }
    qc.invalidateQueries({ queryKey: ["watchlist"] });
  }

  // Resolve album info: mock first, then DB log, then Spotify
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
      // Try Spotify
      try {
        const album = await getSpotifyAlbum(id);
        setInfo({ title: album.title, artist: album.artist, year: album.year, cover: album.cover, genre: album.genre });
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
        .eq("album_key", id)
        .or("rating.not.is.null,review.not.is.null")
        .order("listened_at", { ascending: false }).limit(20);
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
          <div className="relative aspect-square mb-6 overflow-hidden rounded-sm bg-secondary [container-type:inline-size]">
            <AlbumCover src={info.cover} title={info.title} artist={info.artist} className="w-full h-full" />
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
            <div className="flex items-center justify-center gap-1 text-3xl leading-none">
              {[1, 2, 3, 4, 5].map((n) => {
                const halfVal = n - 0.5;
                const fullVal = n;
                const fillPct = rating >= fullVal ? 100 : rating >= halfVal ? 50 : 0;
                return (
                  <span key={n} className="relative inline-block select-none" aria-label={`Rate ${n}`}>
                    <span className="text-muted/20">★</span>
                    <span
                      className="absolute inset-0 overflow-hidden text-accent pointer-events-none"
                      style={{ width: `${fillPct}%` }}
                      aria-hidden
                    >
                      ★
                    </span>
                    <button
                      type="button"
                      onClick={() => setRating(rating === halfVal ? 0 : halfVal)}
                      className="absolute inset-y-0 left-0 w-1/2"
                      aria-label={`${halfVal} stars`}
                    />
                    <button
                      type="button"
                      onClick={() => setRating(rating === fullVal ? 0 : fullVal)}
                      className="absolute inset-y-0 right-0 w-1/2"
                      aria-label={`${fullVal} stars`}
                    />
                  </span>
                );
              })}
            </div>
            <p className="text-center text-[9px] text-muted uppercase tracking-widest mt-2">
              Your rating {rating ? `— ${rating}` : ""}
            </p>
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
              <button onClick={toggleWatch} className={`py-3 font-bold text-sm rounded-sm border flex items-center justify-center gap-2 ${watchId ? "border-accent text-accent" : "border-border text-muted"}`}>
                {watchId ? <><BookmarkCheck className="size-4" /> Saved</> : <><Bookmark className="size-4" /> To listen</>}
              </button>
            )}
          </div>

          <button
            onClick={() => setShareOpen(true)}
            className="mt-3 w-full py-3 font-bold text-sm rounded-sm border border-border text-muted hover:text-accent hover:border-accent flex items-center justify-center gap-2"
          >
            <Send className="size-4" /> Share with a friend
          </button>

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
                  {r.review && <p className="text-sm text-muted leading-relaxed">{r.review}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      {shareOpen && <ShareAlbumDialog albumKey={id} album={info} onClose={() => setShareOpen(false)} />}
    </MobileShell>
  );
}
