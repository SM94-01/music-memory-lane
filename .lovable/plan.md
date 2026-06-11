# Piano TraX — Backend + revisioni Explore / Add / Profile

## 1. Lovable Cloud (auth + persistenza)
- Abilito Cloud
- Schema:
  - `profiles` (id = auth.uid, handle, name, avatar_url, bio_short, bio_long, identity)
  - `follows` (follower_id, following_id)
  - `album_logs` (user_id, album_key, title, artist, year, cover_url, rating, review, listened_at)
  - `likes` (user_id, log_id)
  - `comments` (user_id, log_id, body)
  - `lists` (user_id, title, album_keys[])
  - `notification_prefs` (user_id, new_follower, likes, comments, weekly_wrapped)
- RLS: ognuno vede tutto in lettura (app social pubblica) ma scrive solo su righe proprie. `follows`/`likes` con check `auth.uid() = follower_id/user_id`.
- Trigger auto-crea profilo allo signup con handle randomico modificabile.
- Seed: 8 utenti finti con avatar, bio, identità, ~5 album loggati ciascuno + alcune review (via migrazione SQL).

## 2. Auth
- Pagina `/auth` con tab login / signup (email+password, autoconfirm).
- Onboarding post-signup: handle, nome, bio corta, avatar (upload o iniziali).
- Layout `_authenticated` gestito; le route Explore/Add/Profile diventano protette.

## 3. Explore
- **Following feed**: like e commenti reali (ottimistici), nome utente cliccabile → `/u/$handle`.
- Bottom sheet commenti.
- **Suggested**: invariato visivamente, dati da DB (top rated + trending).

## 4. Add music
- Album result → click su riga apre `/album/$mbid` con info MusicBrainz (titolo, artista, anno, tracklist, tags), tasto "Log/Add".
- Artist result → click apre `/artist/$mbid` con bio + top albums, tasto "Follow artist".
- Nuova tab **Genres**: lista alfabetica generi (search-as-you-type) → al click mostra mix di artisti + album top in quel genere (MusicBrainz tags).
- Tab bar diventa: Albums · Artists · Genres.

## 5. Profile
- Distinzione `me` vs altro utente:
  - Su mio profilo: bottone **Edit profile** (modal con nome/handle/bio corta/bio lunga/avatar) + **Share** (Web Share API) + icona **Settings** apre sheet con toggle notifiche.
  - Su altro utente: **Follow/Unfollow** + **Share** (no settings).
- Tab 1 **Posts**: griglia 3-col degli album loggati dall'utente; tap apre dettaglio con la mia rating/review.
- Tab 2 **Diary**: come ora ma dai dati reali.
- Tab 3 **Wrapped**: playlist auto-generate (Top of 2026, Most listened genre, Hidden gems) → tap apre lista album.
- Album detail navigato da profilo → **back ritorna al profilo** (uso `router.history.back()` invece di link fisso).

## 6. Route nuove
- `/auth`
- `/onboarding`
- `/u/$handle` (profilo pubblico)
- `/album/$id` (riutilizzata; supporta sia mock id che mbid)
- `/artist/$id`
- `/wrapped/$slug`

## Dettagli tecnici
- Server functions in `src/lib/*.functions.ts` con `requireSupabaseAuth` per scritture.
- Letture pubbliche (profili/feed) via server fn con `supabaseAdmin` per evitare blocchi RLS in SSR.
- Seed utenti via migrazione SQL (creo auth.users con `auth.admin` non possibile in migration → uso profili "ghost" senza auth.users collegati per i seed: `profiles.id` diventa `uuid` libero, FK opzionale su `auth.users`).
- Notifiche: solo preferenze salvate; non implemento push reali (fuori scope mobile MVP).
- Share: `navigator.share` con fallback copy-to-clipboard.

## Cosa NON faccio in questo round
- Push notifications reali / email
- Upload immagini profilo reale (uso initials + colore gradient generato dall'handle; placeholder per upload con storage in step successivo se vuoi)
- Algoritmo wrapped vero (lo derivo banalmente da rating/conteggi nelle ultime N settimane)

Confermi così procedo a piena velocità?
