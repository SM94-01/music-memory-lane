
CREATE TABLE public.album_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  album_key text NOT NULL,
  title text NOT NULL,
  artist text NOT NULL,
  year int,
  cover_url text,
  genre text,
  message text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX album_shares_to_user_idx ON public.album_shares(to_user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.album_shares TO authenticated;
GRANT ALL ON public.album_shares TO service_role;
ALTER TABLE public.album_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shares_select_participant" ON public.album_shares
  FOR SELECT TO authenticated
  USING (from_user_id = public.current_profile_id() OR to_user_id = public.current_profile_id());

CREATE POLICY "shares_insert_sender" ON public.album_shares
  FOR INSERT TO authenticated
  WITH CHECK (from_user_id = public.current_profile_id());

CREATE POLICY "shares_update_recipient" ON public.album_shares
  FOR UPDATE TO authenticated
  USING (to_user_id = public.current_profile_id())
  WITH CHECK (to_user_id = public.current_profile_id());

CREATE POLICY "shares_delete_sender" ON public.album_shares
  FOR DELETE TO authenticated
  USING (from_user_id = public.current_profile_id());

ALTER TABLE public.notification_prefs ADD COLUMN album_shares boolean NOT NULL DEFAULT true;
