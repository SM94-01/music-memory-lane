import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Stars } from "@/components/Stars";
import { feed, getAlbum } from "@/data/mock";
import { Heart, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Feed — TraX" }] }),
  component: Home,
});

function Home() {
  return (
    <MobileShell>
      <section className="animate-reveal">
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="text-xs font-mono uppercase tracking-[0.2em] text-accent">Activity</h1>
          <span className="text-[10px] text-muted uppercase">Friends</span>
        </div>

        <div className="space-y-12">
          {feed.map((item) => {
            const album = getAlbum(item.albumId)!;
            return (
              <article key={item.id} className="group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-6 rounded-full bg-muted/20 outline-1 outline-offset-1 outline-border" />
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
                    <h3 className="font-bold text-lg leading-tight text-pretty truncate">{album.title}</h3>
                    <p className="text-sm text-muted mb-2">{album.artist} • {album.year}</p>
                    {item.rating && <Stars value={item.rating} />}
                  </div>
                </Link>

                {item.review && (
                  <p className="mt-3 text-sm text-muted leading-relaxed line-clamp-3">{item.review}</p>
                )}

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
        </div>
      </section>
    </MobileShell>
  );
}
