ALTER TABLE public.album_logs ALTER COLUMN rating TYPE numeric(2,1) USING rating::numeric(2,1);
ALTER TABLE public.album_logs DROP CONSTRAINT IF EXISTS album_logs_rating_check;
ALTER TABLE public.album_logs ADD CONSTRAINT album_logs_rating_check CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5 AND (rating * 2) = floor(rating * 2)));