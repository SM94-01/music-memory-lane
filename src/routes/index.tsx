import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Stars } from "@/components/Stars";
import { Avatar } from "@/components/Avatar";
import { CommentsSheet } from "@/components/CommentsSheet";
import { Heart, MessageCircle, TrendingUp, UserPlus, Loader2, Send, X } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMyProfile } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { mockCoverFor } from "@/data/mock";
import { AlbumCover } from "@/components/AlbumCover";
import { notificationService } from "@/lib/notifications";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Explore — TraX" }] }),
  component: ExplorePage,
});

type Tab = "following" | "suggested";

function ExplorePage() {
  const [tab, setTab] = useState<Tab>("following");
  return (
    <MobileShell>
      <div className="px-5 pt-5">
        <h1 className="text-3xl font-extrabold tracking-tighter mb-5">Explore</h1>
        <div className="flex gap-1 p-1 bg-secondary/60 rounded-full mb-6">
          <TabBtn active={tab === "following"} onClick={() => setTab("following")}>Following</TabBtn>
          <TabBtn active={tab === "suggested"} onClick={() => setTab("suggested")}>Suggested</TabBtn>
        </div>
      </div>
      {tab === "following" ? <FollowingFeed onDiscover={() => setTab("suggested")} /> : <SuggestedTab />}
    </MobileShell>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-full ${active ? "bg-foreground text-background" : "text-muted"}`}>
      {children}
    </button>
  );
}

type LogRow = {
  id: string; album_key: string; title: string; artist: string; year: number | null;
  cover_url: string | null; genre: string | null; rating: number | null; review: string | null;
  created_at: string;
  user: { id: string; handle: string; name: string; avatar_url: string | null } | null;
  likes: { count: number }[];
  comments: { count: number }[];
};

function FollowingFeed({ onDiscover }: { onDiscover: () => void }) {
  const { data: me } = useMyProfile();
  const { data: feed, isLoading } = useQuery({
    queryKey: ["feed", me?.id],
    enabled: !!me,
    queryFn: async () => {
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", me!.id);
      const ids = (follows ?? []).map((f) => f.following_id);
      if (ids.length === 0) return [] as LogRow[];
      const { data } = await supabase
        .from("album_logs")
        .select("id, album_key, title, artist, year, cover_url, genre, rating, review, created_at, user:profiles!album_logs_user_id_fkey(id, handle, name, avatar_url), likes(count), comments(count)")
        .in("user_id", ids)
        .order("created_at", { ascending: false })
        .limit(30);
      return (data as unknown as LogRow[]) ?? [];
    },
  });

  if (isLoading) return <div className="px-5"><Loader2 className="size-5 animate-spin text-muted" /></div>;
  if (!feed || feed.length === 0) {
    return (
      <div className="px-5 text-center py-12">
        <p className="text-sm text-muted mb-4">You're not following anyone yet.</p>
        <button onClick={onDiscover} className="text-xs font-mono uppercase tracking-widest text-accent">Discover people →</button>
      </div>
    );
  }

  return (
    <section className="px-5 space-y-12 mt-2">
      {feed.map((item) => <FeedCard key={item.id} item={item} />)}
    </section>
  );
}

function FeedCard({ item }: { item: LogRow }) {
  const { data: me } = useMyProfile();
  const qc = useQueryClient();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(item.likes[0]?.count ?? 0);
  const [commentCount, setCommentCount] = useState(item.comments[0]?.count ?? 0);
  const [showComments, setShowComments] = useState(false);
  const cover = item.cover_url || mockCoverFor(item.album_key);

  useEffect(() => {
    if (!me) return;
    supabase.from("likes").select("user_id").eq("log_id", item.id).eq("user_id", me.id).maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [me, item.id]);

  useEffect(() => {
    setCommentCount(item.comments[0]?.count ?? 0);
  }, [item.comments]);

  async function toggleLike() {
    if (!me) return;
    if (liked) {
      setLiked(false); setLikeCount((c) => c - 1);
      await supabase.from("likes").delete().eq("log_id", item.id).eq("user_id", me.id);
    } else {
      setLiked(true); setLikeCount((c) => c + 1);
      await supabase.from("likes").insert({ log_id: item.id, user_id: me.id });
      void notificationService.notify({
        type: "like",
        actorId: me.id,
        logId: item.id,
        actorName: me.name ?? me.handle,
        albumTitle: item.title,
      });
    }
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  const time = formatDistanceToNowStrict(new Date(item.created_at), { addSuffix: false }).replace(/ (year|month|week|day|hour|minute|second)s?/, (_, u) => u[0]);

  return (
    <article>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/u/$handle" params={{ handle: item.user?.handle ?? "" }}>
          <Avatar handle={item.user?.handle ?? ""} name={item.user?.name} url={item.user?.avatar_url} size={28} />
        </Link>
        <p className="text-sm italic font-medium">
          <Link to="/u/$handle" params={{ handle: item.user?.handle ?? "" }} className="not-italic font-bold hover:text-accent">{item.user?.name}</Link>
          {" "}<span className="text-muted not-italic font-normal">listened to</span>
        </p>
        <span className="ml-auto text-[10px] font-mono text-muted">{time}</span>
      </div>

      <Link to="/album/$id" params={{ id: item.album_key }} className="flex gap-4">
        <div className="w-32 aspect-square shrink-0 rounded-sm overflow-hidden bg-secondary [container-type:inline-size]">
          <AlbumCover src={cover} title={item.title} artist={item.artist} className="w-full h-full" />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <h3 className="font-bold text-lg leading-tight text-pretty">{item.title}</h3>
          <p className="text-sm text-muted mb-2">{item.artist}{item.year ? ` • ${item.year}` : ""}</p>
          {item.rating ? <Stars value={item.rating} /> : null}
        </div>
      </Link>

      {item.review && <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-3">{item.review}</p>}

      <div className="mt-3 flex gap-5 text-[11px] font-mono text-muted">
        <button onClick={toggleLike} className={`flex items-center gap-1.5 transition-colors ${liked ? "text-accent" : "hover:text-accent"}`}>
          <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} /> {likeCount}
        </button>
        <button onClick={() => setShowComments(true)} className={`flex items-center gap-1.5 hover:text-accent ${commentCount > 0 ? "text-foreground" : ""}`}>
          <MessageCircle className={`size-3.5 ${commentCount > 0 ? "fill-current" : ""}`} /> {commentCount}
        </button>
      </div>

      {showComments && <CommentsSheet logId={item.id} onClose={() => setShowComments(false)} onCountChange={setCommentCount} />}
    </article>
  );
}

function SuggestedTab() {
  const { data: me } = useMyProfile();
  const { data: users } = useQuery({
    queryKey: ["suggestedUsers", me?.id],
    enabled: !!me,
    queryFn: async () => {
      // 1) my taste fingerprint
      const { data: myLogs } = await supabase.from("album_logs").select("genre, artist").eq("user_id", me!.id);
      const myGenres = new Set<string>();
      const myArtists = new Set<string>();
      (myLogs ?? []).forEach((l) => { if (l.genre) myGenres.add(l.genre.toLowerCase()); if (l.artist) myArtists.add(l.artist.toLowerCase()); });

      // 2) candidates: not me, not already followed
      const { data: follows } = await supabase.from("follows").select("following_id").eq("follower_id", me!.id);
      const followedIds = new Set((follows ?? []).map((f) => f.following_id));
      followedIds.add(me!.id);
      const { data: candidates } = await supabase.from("profiles").select("id, handle, name, identity, avatar_url").limit(60);
      const pool = (candidates ?? []).filter((u) => !followedIds.has(u.id));
      if (pool.length === 0) return [];

      // 3) score each candidate by genre/artist overlap
      const ids = pool.map((u) => u.id);
      const { data: theirLogs } = await supabase.from("album_logs").select("user_id, genre, artist").in("user_id", ids);
      const scoreById = new Map<string, number>();
      (theirLogs ?? []).forEach((l) => {
        let s = 0;
        if (l.genre && myGenres.has(l.genre.toLowerCase())) s += 2;
        if (l.artist && myArtists.has(l.artist.toLowerCase())) s += 3;
        scoreById.set(l.user_id, (scoreById.get(l.user_id) ?? 0) + s);
      });
      const scored = pool.map((u) => ({ ...u, _score: scoreById.get(u.id) ?? 0 }));
      // tie-break: a tiny stable random based on id so empty-taste users still get an order
      scored.sort((a, b) => b._score - a._score || a.handle.localeCompare(b.handle));
      return scored.slice(0, 20);
    },
  });
  const { data: trending } = useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      const { data } = await supabase
        .from("album_logs")
        .select("album_key, title, artist, year, cover_url, rating")
        .not("rating", "is", null)
        .order("rating", { ascending: false })
        .limit(10);
      const seen = new Set<string>();
      return (data ?? []).filter((a) => (seen.has(a.album_key) ? false : (seen.add(a.album_key), true)));
    },
  });

  return (
    <section className="mt-2">
      <SharedWithYou />
      <div className="px-5 mb-8">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-accent mb-3">
          <TrendingUp className="size-3.5" /> People to follow
        </div>
        {users && users.length === 0 ? (
          <p className="text-sm text-muted">You already follow everyone we suggest. Nice taste.</p>
        ) : (
          <ul className="space-y-3">
            {users?.map((u) => <SuggestedUser key={u.id} user={u} score={(u as any)._score ?? 0} />)}
          </ul>
        )}
      </div>

      <div className="px-5">
        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted mb-4">Top rated this week</h2>
        <div className="grid grid-cols-2 gap-3">
          {trending?.map((a) => {
            const cover = a.cover_url || mockCoverFor(a.album_key);
            return (
              <Link to="/album/$id" params={{ id: a.album_key }} key={a.album_key}>
                <div className="aspect-square w-full rounded-xs overflow-hidden bg-secondary [container-type:inline-size]">
                  <AlbumCover src={cover} title={a.title} artist={a.artist} className="w-full h-full" />
                </div>
                <p className="text-xs font-bold mt-2 truncate">{a.title}</p>
                <p className="text-[10px] text-muted truncate">{a.artist}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SuggestedUser({ user, score }: { user: { id: string; handle: string; name: string; identity: string | null; avatar_url: string | null }; score: number }) {
  const { data: me } = useMyProfile();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  async function follow() {
    if (!me || busy) return;
    setBusy(true);
    await supabase.from("follows").insert({ follower_id: me.id, following_id: user.id });
    void notificationService.notify({
      type: "follow",
      actorId: me.id,
      recipientId: user.id,
      actorName: me.name ?? me.handle,
    });
    qc.invalidateQueries({ queryKey: ["suggestedUsers"] });
    qc.invalidateQueries({ queryKey: ["feed"] });
  }

  return (
    <li className="flex items-center gap-3">
      <Link to="/u/$handle" params={{ handle: user.handle }}>
        <Avatar handle={user.handle} name={user.name} url={user.avatar_url} size={44} />
      </Link>
      <Link to="/u/$handle" params={{ handle: user.handle }} className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{user.name}</p>
        <p className="text-[11px] text-muted truncate">
          {user.identity || `@${user.handle}`}
          {score > 0 && <span className="text-accent ml-1.5">• similar taste</span>}
        </p>
      </Link>
      <button onClick={follow} disabled={busy} className="text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-foreground text-background disabled:opacity-50">
        <UserPlus className="size-3" /> Follow
      </button>
    </li>
  );
}
