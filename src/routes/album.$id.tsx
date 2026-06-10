import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Stars } from "@/components/Stars";
import { getAlbum, feed } from "@/data/mock";
import { useState } from "react";
import { ArrowLeft, Check, Bookmark } from "lucide-react";

export const Route = createFileRoute("/album/$id")({
  component: AlbumPage,
  notFoundComponent: () => (
    <MobileShell>
      <p className="text-muted text-sm">Album not found.</p>
    </MobileShell>
  ),
  errorComponent: ({ error }) => (
    <MobileShell>
      <p className="text-destructive text-sm">{error.message}</p>
    </MobileShell>
  ),
  loader: ({ params }) => {
    const album = getAlbum(params.id);
    if (!album) throw notFound();
    return { album };
  },
});

function AlbumPage() {
  const { album } = Route.useLoaderData();
  const [rating, setRating] = useState(0);
  const [listened, setListened] = useState(false);
  const [saved, setSaved] = useState(false);
  const reviews = feed.filter((f) => f.albumId === album.id && f.review);

  return (
    <MobileShell>
      <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted mb-4 hover:text-foreground">
        <ArrowLeft className="size-3" /> Back
      </Link>

      <section className="animate-reveal">
        <div className="relative aspect-square mb-6 overflow-hidden rounded-sm">
          <img src={album.cover} alt={album.title} width={1024} height={1024} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tighter text-pretty">{album.title}</h1>
          <p className="text-lg font-medium text-muted">{album.artist} • {album.year}</p>
          <span className="mt-2 inline-block w-fit px-2 py-0.5 bg-accent/10 border border-accent/20 text-accent text-[10px] font-mono uppercase">
            {album.genre}
          </span>
        </div>

        <div className="flex items-center justify-between py-6 border-y border-border my-6">
          <div className="text-center px-4">
            <span className="block font-mono text-lg font-bold">{album.avgRating.toFixed(1)}</span>
            <span className="block text-[9px] text-muted uppercase tracking-widest">Avg Rate</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex-1 px-4 flex flex-col items-center">
            <div className="flex gap-1 text-2xl mb-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} className={n <= rating ? "text-accent" : "text-muted/20"}>
                  ★
                </button>
              ))}
            </div>
            <span className="block text-[9px] text-muted uppercase tracking-widest">Your Rating</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setListened((v) => !v)}
            className={`py-3 font-bold text-sm tracking-tight rounded-sm transition-colors flex items-center justify-center gap-2 ${
              listened ? "bg-accent text-accent-foreground" : "bg-foreground text-background"
            }`}
          >
            {listened && <Check className="size-4" />} {listened ? "Listened" : "Log Listen"}
          </button>
          <button
            onClick={() => setSaved((v) => !v)}
            className={`py-3 font-bold text-sm tracking-tight rounded-sm border border-border flex items-center justify-center gap-2 ${
              saved ? "bg-secondary" : "bg-background"
            }`}
          >
            <Bookmark className={`size-4 ${saved ? "fill-current" : ""}`} /> {saved ? "Saved" : "To Listen"}
          </button>
        </div>

        <div className="mt-10">
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-accent mb-4">Friend Reviews</h2>
          <div className="space-y-6">
            {reviews.length === 0 && <p className="text-sm text-muted">No reviews from friends yet.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="border-t border-border pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm italic font-medium">{r.user}</p>
                  {r.rating && <Stars value={r.rating} />}
                </div>
                <p className="text-sm text-muted leading-relaxed">{r.review}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MobileShell>
  );
}
