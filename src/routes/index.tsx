import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Stars } from "@/components/Stars";
import { feed, albums, getAlbum } from "@/data/mock";
import { Heart, MessageCircle, TrendingUp } from "lucide-react";
import { useState } from "react";

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

      {tab === "following" ? <FollowingFeed /> : <Suggestions />}
    </MobileShell>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-full transition-all ${
        active ? "bg-foreground text-background" : "text-muted"
      }`}
    >
      {children}
    </button>
  );
}

function FollowingFeed() {
  return (
    <section className="animate-reveal px-5 space-y-12 mt-2">
      {feed.map((item) => {
        const album = getAlbum(item.albumId)!;
        return (
          <article key={item.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className="size-7 rounded-full bg-muted/20 outline-1 outline-offset-1 outline-border" />
              <p className="text-sm italic font-medium">
                {item.user} <span className="text-muted not-italic font-normal">{item.action}</span>
              </p>
              <span className="ml-auto text-[10px] font-mono text-muted">{item.time}</span>
            </div>

            <Link to="/album/$id" params={{ id: album.id }} className="flex gap-4">
              <img
                src={album.cover}
                alt={`${album.title} by ${album.artist}`}
                loading="lazy"
                width={512}
                height={512}
                className="w-32 aspect-square object-cover rounded-sm shrink-0"
              />
              <div className="flex flex-col justify-center min-w-0">
                <h3 className="font-bold text-lg leading-tight text-pretty">{album.title}</h3>
                <p className="text-sm text-muted mb-2">{album.artist} • {album.year}</p>
                {item.rating && <Stars value={item.rating} />}
              </div>
            </Link>

            {item.review && <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-3">{item.review}</p>}

            <div className="mt-3 flex gap-5 text-[11px] font-mono text-muted">
              <button className="flex items-center gap-1.5 hover:text-accent transition-colors">
                <Heart className="size-3.5" /> {item.likes}
              </button>
              <button className="flex items-center gap-1.5 hover:text-accent transition-colors">
                <MessageCircle className="size-3.5" /> {item.comments}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function Suggestions() {
  const trending = [...albums].sort((a, b) => b.avgRating - a.avgRating);
  const hero = trending[0];
  const rest = trending.slice(1);

  return (
    <section className="animate-reveal mt-2">
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-accent mb-3">
          <TrendingUp className="size-3.5" /> Trending this week
        </div>
        <Link to="/album/$id" params={{ id: hero.id }} className="block relative aspect-[4/5] overflow-hidden rounded-sm">
          <img src={hero.cover} alt={hero.title} loading="lazy" width={800} height={1000} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <span className="inline-block px-2 py-0.5 bg-accent text-accent-foreground text-[9px] font-mono uppercase tracking-widest mb-2">#1 Trending</span>
            <h3 className="text-2xl font-extrabold tracking-tight">{hero.title}</h3>
            <p className="text-sm text-muted">{hero.artist} • {hero.year}</p>
            <div className="mt-2"><Stars value={hero.avgRating} size="md" /></div>
          </div>
        </Link>
      </div>

      <div className="px-5">
        <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted mb-4">Popular reviews</h2>
        <div className="grid grid-cols-2 gap-3">
          {rest.map((a) => (
            <Link to="/album/$id" params={{ id: a.id }} key={a.id}>
              <img src={a.cover} alt={a.title} loading="lazy" width={400} height={400} className="aspect-square w-full object-cover rounded-xs" />
              <p className="text-xs font-bold mt-2 truncate">{a.title}</p>
              <p className="text-[10px] text-muted truncate">{a.artist}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <Stars value={a.avgRating} />
                <span className="text-[9px] font-mono text-muted">{a.avgRating.toFixed(1)}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
