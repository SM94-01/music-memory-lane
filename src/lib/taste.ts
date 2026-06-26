import { supabase } from "@/integrations/supabase/client";

export type TasteFingerprint = {
  topGenres: string[];   // most-logged genres, lowercase
  topArtists: string[];  // most-logged artists, lowercase
};

export async function fetchTasteFingerprint(userId: string): Promise<TasteFingerprint> {
  const { data } = await supabase.from("album_logs").select("genre, artist").eq("user_id", userId);
  const g = new Map<string, number>(), a = new Map<string, number>();
  (data ?? []).forEach((l) => {
    if (l.genre) g.set(l.genre.toLowerCase(), (g.get(l.genre.toLowerCase()) ?? 0) + 1);
    if (l.artist) a.set(l.artist.toLowerCase(), (a.get(l.artist.toLowerCase()) ?? 0) + 1);
  });
  // also pull from watchlist as a soft preference signal
  const { data: w } = await supabase.from("watchlist").select("genre, artist").eq("user_id", userId);
  (w ?? []).forEach((l) => {
    if (l.genre) g.set(l.genre.toLowerCase(), (g.get(l.genre.toLowerCase()) ?? 0) + 0.5);
    if (l.artist) a.set(l.artist.toLowerCase(), (a.get(l.artist.toLowerCase()) ?? 0) + 0.5);
  });
  const topGenres = [...g.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([k]) => k);
  const topArtists = [...a.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([k]) => k);
  return { topGenres, topArtists };
}
