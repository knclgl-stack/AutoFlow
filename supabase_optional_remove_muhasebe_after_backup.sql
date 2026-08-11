-- OPTIONAL / DESTRUCTIVE SCHEMA CLEANUP
-- Run only after taking a Supabase backup and confirming the accounting feature
-- will not be restored. The production-hardening migration already prevents
-- public access to these columns, so this cleanup is not urgent.

BEGIN;

ALTER TABLE public.galeri_profilleri
  DROP COLUMN IF EXISTS muhasebe_saglayici,
  DROP COLUMN IF EXISTS muhasebe_api_key,
  DROP COLUMN IF EXISTS muhasebe_api_secret,
  DROP COLUMN IF EXISTS muhasebe_cari_grubu;

DROP TABLE IF EXISTS public.fatura_entegrasyon_gecmisi;

COMMIT;
