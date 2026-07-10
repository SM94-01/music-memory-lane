// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SPOTIFY_API = "https://api.spotify.com/v1";

let cachedToken: { token: string; exp: number } | null = null;

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function clampLimit(value: unknown, fallback = 20) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(30, Math.floor(n)));
}

function yearFromDate(date?: string | null) {
  const y = date?.slice(0, 4);
  return y ? Number(y) : null;
}

function largestImage(images?: { url: string; width: number | null; height: number | null }[]) {
  return [...(images ?? [])].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? null;
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Spotify credentials are missing");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });

  if (!res.ok) throw new Error(`Spotify auth failed: ${res.status}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: now + (data.expires_in ?? 3600) };
  return cachedToken.token;
}

async function spotify<T>(path: string): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${SPOTIFY_API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Spotify request failed: ${res.status} ${await res.text()}`);
  return await res.json();
}

function albumFromItem(item: any, genre: string | null = null) {
  return {
    id: item.id,
    title: item.name,
    artist: (item.artists ?? []).map((a: any) => a.name).join(", ") || "Unknown",
    year: yearFromDate(item.release_date),
    cover: largestImage(item.images),
    genre,
    type: item.album_type ?? "album",
  };
}

function artistFromItem(item: any, albums?: any[]) {
  return {
    id: item.id,
    name: item.name,
    image: largestImage(item.images),
    genres: item.genres ?? [],
    followers: item.followers?.total ?? null,
    popularity: item.popularity ?? null,
    albums: albums?.map((a) => albumFromItem(a, item.genres?.[0] ?? null)),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");
    const limit = clampLimit(body.limit);

    if (action === "searchAlbums") {
      const query = String(body.query ?? "").trim();
      if (query.length < 2) return json(400, { error: "Query is too short" });
      const data = await spotify<any>(
        `/search?${new URLSearchParams({ q: query, type: "album", limit: String(limit) })}`,
      );
      return json(200, { albums: (data.albums?.items ?? []).map((a: any) => albumFromItem(a)) });
    }

    if (action === "searchArtists") {
      const query = String(body.query ?? "").trim();
      if (query.length < 2) return json(400, { error: "Query is too short" });
      const data = await spotify<any>(
        `/search?${new URLSearchParams({ q: query, type: "artist", limit: String(limit) })}`,
      );
      return json(200, { artists: (data.artists?.items ?? []).map((a: any) => artistFromItem(a)) });
    }

    if (action === "genre") {
      const genre = String(body.genre ?? "")
        .trim()
        .toLowerCase();
      const kind = body.kind === "artists" ? "artist" : "album";
      if (!genre) return json(400, { error: "Genre is required" });
      const data = await spotify<any>(
        `/search?${new URLSearchParams({ q: `genre:${genre}`, type: kind, limit: String(limit) })}`,
      );
      if (kind === "artist")
        return json(200, { artists: (data.artists?.items ?? []).map((a: any) => artistFromItem(a)) });
      return json(200, { albums: (data.albums?.items ?? []).map((a: any) => albumFromItem(a, genre)) });
    }

    if (action === "album") {
      const id = String(body.id ?? "").trim();
      if (!id) return json(400, { error: "Album id is required" });
      const album = await spotify<any>(`/albums/${encodeURIComponent(id)}`);
      let genre: string | null = album.genres?.[0] ?? null;
      const firstArtistId = album.artists?.[0]?.id;
      if (!genre && firstArtistId) {
        const artist = await spotify<any>(`/artists/${encodeURIComponent(firstArtistId)}`);
        genre = artist.genres?.[0] ?? null;
      }
      return json(200, { album: albumFromItem(album, genre) });
    }

    if (action === "artist") {
      const id = String(body.id ?? "").trim();
      if (!id) return json(400, { error: "Artist id is required" });
      const [artist, releases] = await Promise.all([
        spotify<any>(`/artists/${encodeURIComponent(id)}`),
        spotify<any>(`/artists/${encodeURIComponent(id)}/albums?${new URLSearchParams({ include_groups: "album" })}`),
      ]);
      return json(200, { artist: artistFromItem(artist, releases.items ?? []) });
    }

    return json(400, { error: "Unknown action" });
  } catch (e) {
    console.error("[spotify-catalog]", e);
    return json(500, { error: (e as Error).message });
  }
});
