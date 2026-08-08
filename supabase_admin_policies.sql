-- ====================================================================
-- AutoFlow Abonelik ve Yetkilendirme SQL Göçü (Migration)
-- ====================================================================
-- Bu dosyayı Supabase Dashboard > SQL Editor kısmına yapıştırıp "Run" butonuna basarak çalıştırın.

-- 0. ABONELİK KOLONU EKLEME (Eğer yoksa)
ALTER TABLE public.galeri_profilleri ADD COLUMN IF NOT EXISTS plan text DEFAULT 'Essential';

-- 1. ARAÇLAR (araclar) TABLOSU POLİTİKALARI
-- Eğer eski "Admins can update any vehicle" ve "Admins can delete any vehicle" politikaları varsa temizleyelim:
DROP POLICY IF EXISTS "Admins can update any vehicle" ON public.araclar;
DROP POLICY IF EXISTS "Admins can delete any vehicle" ON public.araclar;

-- Adminlerin tüm araçları düzenleyebilmesini sağlayan politika:
CREATE POLICY "Admins can update any vehicle"
ON public.araclar
FOR UPDATE
TO authenticated
USING (true) -- Herkes görebilir
WITH CHECK (
  auth.jwt() ->> 'email' = 'wwekaannet@gmail.com' OR 
  auth.jwt() ->> 'email' = 'admin@autoflow.com' OR 
  auth.jwt() ->> 'email' = 'kaanclgl@gmail.com' OR
  auth.uid() = user_id -- Ya da aracın kendi sahibiyse
);

-- Adminlerin tüm araçları silebilmesini sağlayan politika:
CREATE POLICY "Admins can delete any vehicle"
ON public.araclar
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'wwekaannet@gmail.com' OR 
  auth.jwt() ->> 'email' = 'admin@autoflow.com' OR 
  auth.jwt() ->> 'email' = 'kaanclgl@gmail.com' OR
  auth.uid() = user_id -- Ya da aracın kendi sahibiyse
);


-- 2. GALERİLER (galeri_profilleri) TABLOSU POLİTİKALARI
-- Eğer eski politikalar varsa temizleyelim:
DROP POLICY IF EXISTS "Admins can update any gallery" ON public.galeri_profilleri;
DROP POLICY IF EXISTS "Admins can delete any gallery" ON public.galeri_profilleri;

-- Adminlerin tüm galerileri düzenleyebilmesini sağlayan politika:
CREATE POLICY "Admins can update any gallery"
ON public.galeri_profilleri
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (
  auth.jwt() ->> 'email' = 'wwekaannet@gmail.com' OR 
  auth.jwt() ->> 'email' = 'admin@autoflow.com' OR 
  auth.jwt() ->> 'email' = 'kaanclgl@gmail.com' OR
  auth.uid() = user_id -- Ya da galerinin kendi sahibiyse
);

-- Adminlerin tüm galerileri silebilmesini sağlayan politika:
CREATE POLICY "Admins can delete any gallery"
ON public.galeri_profilleri
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'wwekaannet@gmail.com' OR 
  auth.jwt() ->> 'email' = 'admin@autoflow.com' OR 
  auth.jwt() ->> 'email' = 'kaanclgl@gmail.com' OR
  auth.uid() = user_id -- Ya da galerinin kendi sahibiyse
);
-- boyali_parcalar kolonu ekle (jsonb array of part IDs)
ALTER TABLE araclar ADD COLUMN IF NOT EXISTS boyali_parcalar jsonb DEFAULT '[]';
