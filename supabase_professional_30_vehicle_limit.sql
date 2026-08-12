-- AutoFlow Professional plan araç kotasını 12'den 30'a çıkarır.
-- Supabase SQL Editor'de tek sefer çalıştırılmalıdır.

BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_vehicle_plan_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_plan text;
  vehicle_limit integer;
  vehicle_count integer;
BEGIN
  SELECT plan INTO current_plan
  FROM public.galeri_profilleri
  WHERE user_id = new.user_id
  FOR UPDATE;

  IF current_plan IS NULL THEN
    RAISE EXCEPTION 'Galeri profili bulunamadı';
  END IF;

  vehicle_limit := CASE current_plan
    WHEN 'Essential' THEN 3
    WHEN 'Professional' THEN 30
    WHEN 'Elite' THEN NULL
    ELSE 3
  END;

  IF vehicle_limit IS NOT NULL THEN
    SELECT count(*) INTO vehicle_count
    FROM public.araclar
    WHERE user_id = new.user_id;

    IF vehicle_count >= vehicle_limit THEN
      RAISE EXCEPTION 'Plan araç limiti doldu (% araç)', vehicle_limit
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN new;
END;
$$;

COMMIT;
