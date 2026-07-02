
-- 1. Create table
CREATE TABLE public.user_push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX user_push_tokens_user_id_idx ON public.user_push_tokens(user_id);

-- 2. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_push_tokens TO authenticated;
GRANT ALL ON public.user_push_tokens TO service_role;

-- 3. RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own push tokens"
  ON public.user_push_tokens FOR SELECT
  TO authenticated
  USING (user_id = public.current_profile_id());

CREATE POLICY "Users can insert their own push tokens"
  ON public.user_push_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.current_profile_id());

CREATE POLICY "Users can update their own push tokens"
  ON public.user_push_tokens FOR UPDATE
  TO authenticated
  USING (user_id = public.current_profile_id())
  WITH CHECK (user_id = public.current_profile_id());

CREATE POLICY "Users can delete their own push tokens"
  ON public.user_push_tokens FOR DELETE
  TO authenticated
  USING (user_id = public.current_profile_id());

-- 4. updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_push_tokens_updated_at
  BEFORE UPDATE ON public.user_push_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
