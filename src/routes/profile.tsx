import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { profile, getAlbum } from "@/data/mock";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: `${profile.handle} — TraX` }] }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <MobileShell>
      <section className="animate-reveal">
        <div className="flex items-end justify-between mb-2">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{profile.handle}</h1>
            <p className="text-sm text-muted mt-1">{profile.name}</p>
            <span className="inline-block mt-3 px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono font-medium uppercase">
              {profile.identity}
            </span>
          </div>
          <div className="text-right">
            <span className="block font-mono text-xl font-bold">{profile.stats.tracked.toLocaleString()}</span>
            <span className="text-[9px] text-muted uppercase tracking-widest">Tracked</span>
          </div>
        </div>

        <p className="mt-4 text-sm text-muted leading-relaxed">{profile.bio}</p>

        <div className="grid grid-cols-3 mt-6 py-4 border-y border-border">
          <Stat label="Reviews" value={profile.stats.reviews} />
          <Stat label="Followers" value={profile.stats.followers} />
          <Stat label="Following" value={profile.stats.following} />
        </div>

        <section className="mt-10">
          <h2 className="text-xs font-mono uppercase tracking-widest mb-4 opacity-50">Current Rotation</h2>
          <div className="grid grid-cols-2 gap-2">
            {profile.topAlbums.map((id) => {
              const album = getAlbum(id)!;
              return (
                <Link key={id} to="/album/$id" params={{ id }} className="block aspect-square overflow-hidden rounded-xs">
                  <img src={album.cover} alt={album.title} loading="lazy" width={512} height={512} className="w-full h-full object-cover" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10 grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-[9px] text-muted uppercase tracking-widest mb-2">Top Genres</h3>
            <ul className="space-y-1.5">
              {profile.topGenres.map((g) => (
                <li key={g} className="font-mono text-sm">{g}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[9px] text-muted uppercase tracking-widest mb-2">Top Artists</h3>
            <ul className="space-y-1.5">
              {profile.topArtists.map((a) => (
                <li key={a} className="font-mono text-sm">{a}</li>
              ))}
            </ul>
          </div>
        </section>

        <Link to="/diary" className="mt-10 block text-center py-3 border border-border rounded-sm font-bold text-sm hover:bg-secondary">
          Open Diary
        </Link>
      </section>
    </MobileShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <span className="block font-mono text-lg font-bold">{value.toLocaleString()}</span>
      <span className="block text-[9px] text-muted uppercase tracking-widest">{label}</span>
    </div>
  );
}
