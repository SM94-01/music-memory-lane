-- Update handle_new_user to use username from signup metadata if provided
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requested TEXT;
  base_handle TEXT;
  candidate TEXT;
  i INT := 0;
BEGIN
  requested := lower(regexp_replace(coalesce(NEW.raw_user_meta_data->>'username', ''), '[^a-z0-9_]', '', 'g'));
  IF length(requested) >= 3 THEN
    base_handle := requested;
  ELSE
    base_handle := lower(regexp_replace(coalesce(split_part(NEW.email, '@', 1), 'listener'), '[^a-z0-9]', '', 'g'));
    IF length(base_handle) < 3 THEN base_handle := 'listener'; END IF;
  END IF;

  candidate := base_handle;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(handle) = candidate) LOOP
    i := i + 1;
    candidate := base_handle || i::text;
  END LOOP;

  INSERT INTO public.profiles (auth_user_id, handle, name, identity, bio_short)
  VALUES (NEW.id, candidate, coalesce(NEW.raw_user_meta_data->>'username', candidate), 'New Listener', 'Just joined TraX.');
  RETURN NEW;
END;
$function$;

-- Ensure case-insensitive uniqueness on handle
CREATE UNIQUE INDEX IF NOT EXISTS profiles_handle_lower_key ON public.profiles (lower(handle));