CREATE TABLE public.identity_unlocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  identity_key text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, identity_key)
);

GRANT SELECT, INSERT, DELETE ON public.identity_unlocks TO authenticated;
GRANT ALL ON public.identity_unlocks TO service_role;

ALTER TABLE public.identity_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their unlocks"
  ON public.identity_unlocks FOR SELECT TO authenticated
  USING (user_id = public.current_profile_id());

CREATE POLICY "Users can create their unlocks"
  ON public.identity_unlocks FOR INSERT TO authenticated
  WITH CHECK (user_id = public.current_profile_id());

CREATE POLICY "Users can delete their unlocks"
  ON public.identity_unlocks FOR DELETE TO authenticated
  USING (user_id = public.current_profile_id());
