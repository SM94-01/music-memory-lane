import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { MobileShell } from "@/components/MobileShell";
import { Stars } from "@/components/Stars";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { mockCoverFor } from "@/data/mock";
import { z } from "zod";

export const Route = createFileRoute("/wrapped/$slug")({
  head: () => ({ meta: [{ title: "Wrapped — TraX" }] }),
  validateSearch: (s) => z.object({ u: z.string() }).parse(s),
  component: WrappedPage,
});

function WrappedPage() {
  const { slug } = Route.useParams();
  const { u } = Route.useSearch();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["wrapped", u, slug],
    queryFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("id, name, handle").eq("handle", u).maybeSingle();
      if (!profile) return null;
      const { data: logs } = await supabase
        .from("album_logs")
        .select("id, album_key, title, artist, year, cover_url, rating, genre, listened_at")
        .eq("user_id", profile.id)
        .order("listened_at", { ascending: false });
      return { profile, logs: logs ?? [] };
    },
  });

  if (isLoading) return <MobileShell><div className="px-5 py-12 flex justify-center"><Loader2 className="size-5 animate-spin text-muted" /></div></MobileShell>;
  if (!data) return <MobileShell><p className="px-5 text-sm text-muted">Not found.</p></MobileShell>;

  let title = "Wrapped";
  let items = data.logs;

  if (slug === "top-rated") {
    title = "Top-rated picks";
    items = data.logs.filter((l) => (l.rating ?? 0) >= 4);
  } else if (slug === "recent") {
    title = "Recently spinning";
    items = data.logs.slice(0, 20);
  } else if (slug.startsWith("genre-")) {
    const g = slug.slice(6);
    title = `${g} core`;
    items = data.logs.filter((l) => l.genre === g);
  } else if (slug.startsWith("artist-")) {
    const a = slug.slice(7);
    title = `On rotation: ${a}`;
    items = data.logs.filter((l) => l.artist === a);
  }

  return (
    <MobileShell>
      <div className="px-5 pt-3">
        <button onClick={() => router.history.back()} className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted mb-4 hover:text-foreground">
          <ArrowLeft className="size-3" /> Back
        </button>
        <h1 className="text-3xl font-extrabold tracking-tighter">{title}</h1>
        <p className="text-xs text-muted mb-6">A wrapped from @{data.profile.handle} • {items.length} albums</p>

        <div className="space-y-3">
          {items.map((l) => {
            const cover = l.cover_url || mockCoverFor(l.album_key);
            return (
              <Link to="/album/$id" params={{ id: l.album_key }} key={l.id} className="flex items-center gap-3">
                {cover ? <img src={cover} alt="" className="size-14 object-cover rounded-xs shrink-0" /> :
                  <div className="size-14 bg-secondary rounded-xs shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{l.title}</p>
                  <p className="text-[11px] text-muted truncate">{l.artist}{l.year ? ` • ${l.year}` : ""}</p>
                  {l.rating ? <Stars value={l.rating} /> : null}
                </div>
              </Link>
            );
          })}
          {items.length === 0 && <p className="text-sm text-muted text-center py-8">Nothing here yet.</p>}
        </div>
      </div>
    </MobileShell>
  );
}
