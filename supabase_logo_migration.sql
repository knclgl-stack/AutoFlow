-- ====================================================================
-- AutoFlow Galeri Profili Logo Kolonu Göçü (Migration)
-- ====================================================================
-- Bu kodu Supabase Dashboard > SQL Editor kısmında bir defaya mahsus çalıştırın.

-- galeri_profilleri tablosuna logo_url kolonunu ekle (eğer yoksa)
ALTER TABLE public.galeri_profilleri ADD COLUMN IF NOT EXISTS logo_url text;
