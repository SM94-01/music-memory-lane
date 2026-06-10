import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Stars } from "@/components/Stars";
import { profile, getAlbum, diary, albums } from "@/data/mock";
import { Settings, Grid3x3, BookOpen, ListMusic, UserPlus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: `${profile.handle} — TraX` }] }),
  component: ProfilePage,
});

type Tab = "albums" | "diary" | "lists";

function ProfilePage() {
  const [tab, setTab] = useState<Tab>("albums");

  return (
    <MobileShell>
      {/* Header */}
      <div className="px-5 pt-4 flex justify-between items-start">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted">@{profile.handle.toLowerCase()}</span>
        <button className="opacity-60 hover:opacity-100"><Settings className="size-4" /></button>
      </div>

      {/* IG-style identity block */}
      <div className="px-5 pt-4 flex items-center gap-5">
        <div className="size-20 rounded-full bg-gradient-to-br from-accent via-accent/40 to-secondary p-[2px]">
          <div className="size-full rounded-full bg-secondary grid place-items-center font-extrabold text-2xl">
            {profile.name.charAt(0)}
          </div>
        </div>
        <div className="flex-1 grid grid-cols-3 text-center">
          <Stat value={profile.stats.tracked} label="Albums" />
          <Stat value={profile.stats.followers} label="Followers" />
          <Stat value={profile.stats.following} label="Following" />
        </div>
      </div>

      <div className="px-5 mt-4">
        <h1 className="font-extrabold text-lg tracking-tight">{profile.name}</h1>
        <span className="inline-block mt-1 px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono font-medium uppercase">
          {profile.identity}
        </span>
        <p className="mt-3 text-sm text-muted leading-relaxed">{profile.bio}</p>

        <div className="flex gap-2 mt-4">
          <button className="flex-1 bg-foreground text-background py-2 rounded-sm text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <UserPlus className="size-3.5" /> Follow
          </button>
          <button className="flex-1 border border-border py-2 rounded-sm text-xs font-bold uppercase tracking-widest">
            Share
          </button>
        </div>
      </div>

      {/* Taste row */}
      <div className="px-5 mt-6 grid grid-cols-2 gap-6">
        <TasteCol label="Top Genres" items={profile.topGenres} />
        <TasteCol label="Top Artists" items={profile.topArtists} />
      </div>

      {/* Tabs */}
      <div className="mt-6 border-y border-border grid grid-cols-3">
        <TabBtn active={tab === "albums"} onClick={() => setTab("albums")} icon={<Grid3x3 className="size-4" />} />
        <TabBtn active={tab === "diary"} onClick={() => setTab("diary")} icon={<BookOpen className="size-4" />} />
        <TabBtn active={tab === "lists"} onClick={() => setTab("lists")} icon={<ListMusic className="size-4" />} />
      </div>

      {/* Tab content */}
      {tab === "albums" && (
        <div className="grid grid-cols-3 gap-px bg-border mt-px">
          {albums.map((a) => (
            <Link key={a.id} to="/album/$id" params={{ id: a.id }} className="aspect-square block bg-background">
              <img src={a.cover} alt={a.title} loading="lazy" width={300} height={300} className="size-full object-cover" />
            </Link>
          ))}
        </div>
      )}

      {tab === "diary" && (
        <div className="px-5 py-6 space-y-8 relative">
          {diary.map((m) => (
            <div key={m.month}>
              <h2 className="text-[10px] font-mono text-muted uppercase tracking-widest mb-3">{m.month}</h2>
              <div className="space-y-3">
                {m.entries.map((e) => {
                  const album = getAlbum(e.albumId)!;
                  return (
                    <Link to="/album/$id" params={{ id: album.id }} key={e.albumId + e.date} className="flex items-center gap-3">
                      <img src={album.cover} alt={album.title} loading="lazy" width={96} height={96} className="size-12 object-cover rounded-xs shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold truncate">{album.title}</p>
                        <div className="flex items-center gap-2"><Stars value={e.rating} /><span className="text-[10px] font-mono text-muted">{e.date}</span></div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "lists" && (
        <div className="px-5 py-6 space-y-4">
          <ListCard title="Best of 2024" count={12} covers={[albums[0], albums[3], albums[7]]} />
          <ListCard title="Late-night shoegaze" count={8} covers={[albums[3], albums[7], albums[4]]} />
          <ListCard title="Records that built me" count={20} covers={[albums[4], albums[5], albums[3]]} />
        </div>
      )}
    </MobileShell>
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

function TasteCol({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-[9px] text-muted uppercase tracking-widest mb-2">{label}</h3>
      <ul className="space-y-1">
        {items.map((i) => <li key={i} className="font-mono text-xs">{i}</li>)}
      </ul>
    </div>
  );
}

function TabBtn({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`py-3 flex items-center justify-center border-b-2 transition-colors ${
        active ? "border-foreground text-foreground" : "border-transparent text-muted"
      }`}
    >
      {icon}
    </button>
  );
}

function ListCard({ title, count, covers }: { title: string; count: number; covers: { cover: string; title: string }[] }) {
  return (
    <div className="flex items-center gap-4 border border-border rounded-sm p-3">
      <div className="flex -space-x-3">
        {covers.map((c, i) => (
          <img key={i} src={c.cover} alt="" loading="lazy" width={96} height={96} className="size-12 object-cover rounded-xs ring-2 ring-background" />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate">{title}</p>
        <p className="text-[10px] font-mono text-muted uppercase tracking-widest">{count} albums</p>
      </div>
    </div>
  );
}
