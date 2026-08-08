-- ====================================================================
-- AutoFlow Araç Açıklama Kolonu Göçü (Migration)
-- ====================================================================
-- Bu kodu Supabase Dashboard > SQL Editor kısmında bir defaya mahsus çalıştırın.

-- araclar tablosuna aciklama kolonunu ekle (eğer yoksa)
ALTER TABLE public.araclar ADD COLUMN IF NOT EXISTS aciklama text;
