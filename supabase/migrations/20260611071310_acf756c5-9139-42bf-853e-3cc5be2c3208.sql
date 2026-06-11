
-- ============ TABLES ============

CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio_short TEXT,
  bio_long TEXT,
  identity TEXT,
  is_seed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.album_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  album_key TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  year INT,
  cover_url TEXT,
  genre TEXT,
  rating INT CHECK (rating >= 0 AND rating <= 5),
  review TEXT,
  listened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_album_logs_user ON public.album_logs(user_id);
CREATE INDEX idx_album_logs_album ON public.album_logs(album_key);
CREATE INDEX idx_album_logs_created ON public.album_logs(created_at DESC);

CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
CREATE INDEX idx_follows_following ON public.follows(following_id);

CREATE TABLE public.likes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_id UUID NOT NULL REFERENCES public.album_logs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, log_id)
);
CREATE INDEX idx_likes_log ON public.likes(log_id);

CREATE TABLE public.comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  log_id UUID NOT NULL REFERENCES public.album_logs(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_log ON public.comments(log_id);

CREATE TABLE public.notification_prefs (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  new_follower BOOLEAN NOT NULL DEFAULT true,
  likes BOOLEAN NOT NULL DEFAULT true,
  comments BOOLEAN NOT NULL DEFAULT true,
  weekly_wrapped BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ GRANTS ============

GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.album_logs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.album_logs TO authenticated;
GRANT ALL ON public.album_logs TO service_role;

GRANT SELECT ON public.follows TO anon, authenticated;
GRANT INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

GRANT SELECT ON public.likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;

GRANT SELECT ON public.comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.notification_prefs TO authenticated;
GRANT ALL ON public.notification_prefs TO service_role;

-- ============ HELPER ============

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS UUID
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1
$$;

-- ============ RLS ============

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());

ALTER TABLE public.album_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_read_all" ON public.album_logs FOR SELECT USING (true);
CREATE POLICY "logs_write_own" ON public.album_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_profile_id());
CREATE POLICY "logs_update_own" ON public.album_logs FOR UPDATE TO authenticated
  USING (user_id = public.current_profile_id()) WITH CHECK (user_id = public.current_profile_id());
CREATE POLICY "logs_delete_own" ON public.album_logs FOR DELETE TO authenticated
  USING (user_id = public.current_profile_id());

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_read_all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT TO authenticated
  WITH CHECK (follower_id = public.current_profile_id());
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE TO authenticated
  USING (follower_id = public.current_profile_id());

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes_read_all" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_profile_id());
CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE TO authenticated
  USING (user_id = public.current_profile_id());

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_read_all" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_profile_id());
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO authenticated
  USING (user_id = public.current_profile_id());

ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs_select_own" ON public.notification_prefs FOR SELECT TO authenticated
  USING (user_id = public.current_profile_id());
CREATE POLICY "prefs_upsert_own" ON public.notification_prefs FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_profile_id());
CREATE POLICY "prefs_update_own" ON public.notification_prefs FOR UPDATE TO authenticated
  USING (user_id = public.current_profile_id()) WITH CHECK (user_id = public.current_profile_id());

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  base_handle TEXT;
  candidate TEXT;
  i INT := 0;
BEGIN
  base_handle := lower(regexp_replace(coalesce(split_part(NEW.email, '@', 1), 'listener'), '[^a-z0-9]', '', 'g'));
  IF length(base_handle) < 3 THEN base_handle := 'listener'; END IF;
  candidate := base_handle;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE handle = candidate) LOOP
    i := i + 1;
    candidate := base_handle || i::text;
  END LOOP;
  INSERT INTO public.profiles (auth_user_id, handle, name, identity, bio_short)
  VALUES (NEW.id, candidate, coalesce(NEW.raw_user_meta_data->>'name', candidate), 'New Listener', 'Just joined TraX.');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SEED USERS ============

INSERT INTO public.profiles (handle, name, identity, bio_short, bio_long, is_seed) VALUES
  ('marcus_w', 'Marcus Webb', 'Post-Punk Purist', 'Sharp guitars, sharper opinions.', 'Cataloguing every great post-punk record since 2018. London-based.', true),
  ('elena_k', 'Elena Kovacs', 'Vinyl Archivist', 'Wax over algorithms.', 'Trying to fill the gaps in my collection one record store at a time.', true),
  ('sasha_d', 'Sasha Dunn', 'Shoegaze Devotee', 'My ears are still ringing from 1991.', 'Reverb is a way of life. Slowdive, MBV, Ride — the holy trinity.', true),
  ('theo_m', 'Theo Mensah', 'Hip-Hop Historian', 'Lyrics over loops.', 'From the boom-bap era to the present. Kendrick is the GOAT, fight me.', true),
  ('june_s', 'June Sato', 'Jazz Wanderer', 'Listening sideways.', 'Free jazz, spiritual jazz, fusion. I follow the saxophones.', true),
  ('lou_r', 'Lou Rivera', 'Electronic Explorer', 'Sub-bass and ambient drift.', 'From Burial to Caterina Barbieri. Late-night listener.', true),
  ('priya_v', 'Priya Vasudevan', 'Folk Romantic', 'Acoustic and aching.', 'Bon Iver, Nick Drake, Adrianne Lenker. Cry-worthy ballads welcomed.', true),
  ('kai_b', 'Kai Becker', 'Indie Generalist', 'Trying everything once.', 'Curious omnivore. New releases every Friday, deep cuts every weekend.', true);

-- ============ SEED ALBUM LOGS ============

-- Reusable album set matching mock covers (album_key matches local mock id)
WITH alb AS (
  SELECT * FROM (VALUES
    ('blue-rev','Blue Rev','Alvvays',2022,'Indie Rock'),
    ('the-overload','The Overload','Yard Act',2022,'Post-Punk'),
    ('promises','Promises','Floating Points',2021,'Jazz'),
    ('souvlaki','Souvlaki','Slowdive',1993,'Shoegaze'),
    ('unknown-pleasures','Unknown Pleasures','Joy Division',1979,'Post-Punk'),
    ('to-pimp','To Pimp a Butterfly','Kendrick Lamar',2015,'Hip-Hop'),
    ('for-emma','For Emma, Forever Ago','Bon Iver',2007,'Folk'),
    ('untrue','Untrue','Burial',2007,'Electronic')
  ) AS t(album_key,title,artist,year,genre)
)
INSERT INTO public.album_logs (user_id, album_key, title, artist, year, cover_url, genre, rating, review, listened_at)
SELECT p.id, a.album_key, a.title, a.artist, a.year, NULL, a.genre,
  (3 + floor(random()*3))::int,
  CASE WHEN random() < 0.5 THEN
    (ARRAY[
      'Floored me on first listen. Genuinely cinematic.',
      'Holds up better than I remembered.',
      'Every track earns its place. No filler.',
      'The kind of record I keep returning to.',
      'Production is immaculate.',
      'Lyrics hit differently this year.',
      'A masterclass. Essential listening.',
      'Slow burn but worth it.'
    ])[1 + floor(random()*8)::int]
  ELSE NULL END,
  now() - (random() * interval '90 days')
FROM public.profiles p
CROSS JOIN alb a
WHERE p.is_seed = true AND random() < 0.5;

-- ============ REALTIME (optional) ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
