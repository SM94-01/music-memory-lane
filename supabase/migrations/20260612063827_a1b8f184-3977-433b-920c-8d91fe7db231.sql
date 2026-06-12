
-- 1) Watchlist (to-listen todos)
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  album_key TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  year INT,
  cover_url TEXT,
  genre TEXT,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, album_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.watchlist TO authenticated;
GRANT ALL ON public.watchlist TO service_role;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "watchlist read public" ON public.watchlist FOR SELECT TO authenticated USING (true);
CREATE POLICY "watchlist insert own" ON public.watchlist FOR INSERT TO authenticated WITH CHECK (user_id = public.current_profile_id());
CREATE POLICY "watchlist update own" ON public.watchlist FOR UPDATE TO authenticated USING (user_id = public.current_profile_id());
CREATE POLICY "watchlist delete own" ON public.watchlist FOR DELETE TO authenticated USING (user_id = public.current_profile_id());

-- 2) Direct messages
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages read mine" ON public.messages FOR SELECT TO authenticated
  USING (sender_id = public.current_profile_id() OR recipient_id = public.current_profile_id());
CREATE POLICY "messages send" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = public.current_profile_id());
CREATE POLICY "messages mark read" ON public.messages FOR UPDATE TO authenticated
  USING (recipient_id = public.current_profile_id());

-- 3) Drop weekly_wrapped from notification_prefs
ALTER TABLE public.notification_prefs DROP COLUMN IF EXISTS weekly_wrapped;
