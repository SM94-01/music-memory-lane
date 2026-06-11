import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Avatar } from "@/components/Avatar";
import { Stars } from "@/components/Stars";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { SettingsSheet } from "@/components/SettingsSheet";
import { Settings, Grid3x3, BookOpen, Sparkles, UserPlus, Check, Share2, Pencil, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMyProfile, type Profile } from "@/lib/auth";
import { mockCoverFor } from "@/data/mock";

type Tab = "posts" | "diary" | "wrapped";
type Log = {
  id: string; album_key: string; title: string; artist: string; year: number | null;
  cover_url: string | null; rating: number | null; review: string | null; listened_at: string; genre: string | null;
};

export function ProfileView({ profile, fromProfile = false }: { profile: Profile; fromProfile?: boolean }) {
  const { data: me } = useMyProfile();
  const isMe = me?.id === profile.id;
  const [tab, setTab] = useState<Tab>("posts");
  const [editing, setEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: logs } = useQuery({
    queryKey: ["logs", profile.id],
    queryFn: async (): Promise<Log[]> => {
      const { data } = await supabase
        .from("album_logs")
        .select("id, album_key, title, artist, year, cover_url, rating, review, listened_at, genre")
        .eq("user_id", profile.id)
        .order("listened_at", { ascending: false });
      return (data as Log[]) ?? [];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["profileCounts", profile.id],
    queryFn: async () => {
      const [{ count: tracked }, { count: followers }, { count: following }] = await Promise.all([
        supabase.from("album_logs").select("*", { count: "exact", head: true }).eq("user_id", profile.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", profile.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profile.id),
      ]);
      return { tracked: tracked ?? 0, followers: followers ?? 0, following: following ?? 0 };
    },
  });

  async function share() {
    const url = `${window.location.origin}/u/${profile.handle}`;
    if (navigator.share) {
      try { await navigator.share({ title: `${profile.name} on TraX`, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("Profile link copied!");
    }
  }

  const albumLinkState = fromProfile ? { from: "profile" as const } : undefined;

  return (
    <>
      <div className="px-5 pt-4 flex justify-between items-start">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted">@{profile.handle}</span>
        {isMe && (
          <button onClick={() => setSettingsOpen(true)} className="opacity-60 hover:opacity-100"><Settings className="size-4" /></button>
        )}
      </div>

      <div className="px-5 pt-4 flex items-center gap-5">
        <Avatar handle={profile.handle} name={profile.name} url={profile.avatar_url} size={80} ring />
        <div className="flex-1 grid grid-cols-3 text-center">
          <Stat value={counts?.tracked ?? 0} label="Albums" />
          <Stat value={counts?.followers ?? 0} label="Followers" />
          <Stat value={counts?.following ?? 0} label="Following" />
        </div>
      </div>

      <div className="px-5 mt-4">
        <h1 className="font-extrabold text-lg tracking-tight">{profile.name}</h1>
        {profile.identity && (
          <span className="inline-block mt-1 px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono font-medium uppercase">
            {profile.identity}
          </span>
        )}
        {profile.bio_short && <p className="mt-3 text-sm text-muted leading-relaxed">{profile.bio_short}</p>}
        {profile.bio_long && <p className="mt-2 text-sm text-muted leading-relaxed whitespace-pre-line">{profile.bio_long}</p>}

        <div className="flex gap-2 mt-4">
          {isMe ? (
            <button onClick={() => setEditing(true)} className="flex-1 bg-foreground text-background py-2 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <Pencil className="size-3.5" /> Edit profile
            </button>
          ) : (
            <FollowButton targetId={profile.id} />
          )}
          <button onClick={share} className="flex-1 border border-border py-2 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <Share2 className="size-3.5" /> Share
          </button>
        </div>
      </div>

      <div className="mt-6 border-y border-border grid grid-cols-3">
        <TabBtn active={tab === "posts"} onClick={() => setTab("posts")} icon={<Grid3x3 className="size-4" />} />
        <TabBtn active={tab === "diary"} onClick={() => setTab("diary")} icon={<BookOpen className="size-4" />} />
        <TabBtn active={tab === "wrapped"} onClick={() => setTab("wrapped")} icon={<Sparkles className="size-4" />} />
      </div>

      {!logs && <div className="py-8 flex justify-center"><Loader2 className="size-5 animate-spin text-muted" /></div>}

      {tab === "posts" && logs && (
        logs.length === 0 ? (
          <p className="text-sm text-muted text-center py-12 px-5">No albums tracked yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-px bg-border mt-px">
            {logs.map((l) => {
              const cover = l.cover_url || mockCoverFor(l.album_key);
              return (
                <Link key={l.id} to="/album/$id" params={{ id: l.album_key }} state={albumLinkState as any} className="aspect-square block bg-background relative">
                  {cover ? (
                    <img src={cover} alt={l.title} loading="lazy" className="size-full object-cover" />
                  ) : (
                    <div className="size-full grid place-items-center text-xs text-muted font-bold p-1 text-center">{l.title}</div>
                  )}
                  {l.rating ? (
                    <span className="absolute bottom-1 left-1 text-[9px] font-mono px-1 py-0.5 bg-background/80 text-accent rounded-xs">★ {l.rating}</span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )
      )}

      {tab === "diary" && logs && <DiaryView logs={logs} fromProfile={fromProfile} />}
      {tab === "wrapped" && logs && <WrappedView logs={logs} handle={profile.handle} />}

      {editing && me && <EditProfileDialog profile={me} onClose={() => setEditing(false)} />}
      {settingsOpen && me && <SettingsSheet profileId={me.id} onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

function FollowButton({ targetId }: { targetId: string }) {
  const { data: me } = useMyProfile();
  const qc = useQueryClient();
  const [following, setFollowing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!me) return;
    supabase.from("follows").select("follower_id").eq("follower_id", me.id).eq("following_id", targetId).maybeSingle()
      .then(({ data }) => { setFollowing(!!data); setLoaded(true); });
  }, [me, targetId]);

  async function toggle() {
    if (!me) return;
    if (following) {
      setFollowing(false);
      await supabase.from("follows").delete().eq("follower_id", me.id).eq("following_id", targetId);
    } else {
      setFollowing(true);
      await supabase.from("follows").insert({ follower_id: me.id, following_id: targetId });
    }
    qc.invalidateQueries();
  }

  return (
    <button onClick={toggle} disabled={!loaded} className={`flex-1 py-2 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 ${following ? "border border-border text-muted" : "bg-foreground text-background"}`}>
      {following ? <><Check className="size-3.5" /> Following</> : <><UserPlus className="size-3.5" /> Follow</>}
    </button>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <span className="block font-mono text-lg font-bold">{value.toLocaleString()}</span>
      <span className="text-[9px] text-muted uppercase tracking-widest">{label}</span>
    </div>
  );
}
function TabBtn({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`py-3 flex items-center justify-center border-b-2 transition-colors ${active ? "border-foreground text-foreground" : "border-transparent text-muted"}`}>
      {icon}
    </button>
  );
}

function DiaryView({ logs, fromProfile }: { logs: Log[]; fromProfile: boolean }) {
  const groups = new Map<string, Log[]>();
  logs.forEach((l) => {
    const d = new Date(l.listened_at);
    const k = d.toLocaleString("en", { month: "long", year: "numeric" });
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(l);
  });
  const albumLinkState = fromProfile ? { from: "profile" as const } : undefined;
  return (
    <div className="px-5 py-6 space-y-8">
      {Array.from(groups.entries()).map(([month, entries]) => (
        <div key={month}>
          <h2 className="text-[10px] font-mono text-muted uppercase tracking-widest mb-3">{month}</h2>
          <div className="space-y-3">
            {entries.map((l) => {
              const cover = l.cover_url || mockCoverFor(l.album_key);
              return (
                <Link to="/album/$id" params={{ id: l.album_key }} state={albumLinkState as any} key={l.id} className="flex items-center gap-3">
                  {cover ? <img src={cover} alt={l.title} loading="lazy" className="size-12 object-cover rounded-xs shrink-0" /> :
                    <div className="size-12 bg-secondary rounded-xs shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{l.title}</p>
                    <div className="flex items-center gap-2">
                      {l.rating ? <Stars value={l.rating} /> : <span className="text-[10px] text-muted">no rating</span>}
                      <span className="text-[10px] font-mono text-muted">{new Date(l.listened_at).toLocaleDateString("en", { day: "2-digit", month: "short" })}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WrappedView({ logs, handle }: { logs: Log[]; handle: string }) {
  // Build auto playlists
  const byGenre = new Map<string, Log[]>();
  logs.forEach((l) => { if (l.genre) { if (!byGenre.has(l.genre)) byGenre.set(l.genre, []); byGenre.get(l.genre)!.push(l); } });
  const topGenre = Array.from(byGenre.entries()).sort((a, b) => b[1].length - a[1].length)[0];

  const byArtist = new Map<string, Log[]>();
  logs.forEach((l) => { if (!byArtist.has(l.artist)) byArtist.set(l.artist, []); byArtist.get(l.artist)!.push(l); });
  const topArtist = Array.from(byArtist.entries()).sort((a, b) => b[1].length - a[1].length)[0];

  const topRated = [...logs].filter((l) => (l.rating ?? 0) >= 4).slice(0, 12);
  const recent = logs.slice(0, 10);

  const playlists = [
    { slug: "top-rated", title: "Top-rated picks", subtitle: `${topRated.length} albums you loved`, items: topRated },
    topGenre ? { slug: `genre-${topGenre[0]}`, title: `Your ${topGenre[0]} core`, subtitle: `${topGenre[1].length} albums`, items: topGenre[1] } : null,
    topArtist && topArtist[1].length > 1 ? { slug: `artist-${topArtist[0]}`, title: `On rotation: ${topArtist[0]}`, subtitle: `${topArtist[1].length} albums`, items: topArtist[1] } : null,
    { slug: "recent", title: "Recently spinning", subtitle: `Last ${recent.length} albums`, items: recent },
  ].filter(Boolean) as { slug: string; title: string; subtitle: string; items: Log[] }[];

  return (
    <div className="px-5 py-6 space-y-3">
      {playlists.map((p) => (
        <Link key={p.slug} to="/wrapped/$slug" params={{ slug: p.slug }} search={{ u: handle }} className="flex items-center gap-4 border border-border rounded-sm p-3 hover:border-accent transition-colors">
          <div className="flex -space-x-3">
            {p.items.slice(0, 3).map((it) => {
              const cover = it.cover_url || mockCoverFor(it.album_key);
              return cover ? (
                <img key={it.id} src={cover} alt="" className="size-12 object-cover rounded-xs ring-2 ring-background" />
              ) : (
                <div key={it.id} className="size-12 bg-secondary rounded-xs ring-2 ring-background" />
              );
            })}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{p.title}</p>
            <p className="text-[10px] font-mono text-muted uppercase tracking-widest">{p.subtitle}</p>
          </div>
        </Link>
      ))}
      {playlists.length === 0 && <p className="text-sm text-muted text-center py-8">Log a few albums to unlock your Wrapped.</p>}
    </div>
  );
}
