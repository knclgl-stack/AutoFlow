-- ====================================================================
-- AutoFlow Akıllı Bildirim Sistemi Veritabanı Kurulumu (SQL)
-- ====================================================================
-- Bu SQL kodunu Supabase Dashboard > SQL Editor alanına yapıştırıp "Run" edebilirsiniz.

-- 1. BİLDİRİMLER TABLOSUNU OLUŞTUR
CREATE TABLE IF NOT EXISTS public.bildirimler (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE, -- Boş bırakılırsa tüm kullanıcılara gider (global)
  title text NOT NULL,
  description text NOT NULL,
  read boolean DEFAULT false NOT NULL, -- Tekil bildirimler için okundu bilgisi
  read_by text[] DEFAULT '{}'::text[] NOT NULL, -- Global bildirimleri kimlerin okuduğunu tutar (User ID dizisi)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Aktifleştir
ALTER TABLE public.bildirimler ENABLE ROW LEVEL SECURITY;

-- 2. GÜVENLİK POLİTİKALARI (SELECT, UPDATE, ALL)

-- Her kullanıcı kendine özel veya global (herkese açık) bildirimleri görebilir
DROP POLICY IF EXISTS "Users can read own or global notifications" ON public.bildirimler;
CREATE POLICY "Users can read own or global notifications"
ON public.bildirimler FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

-- Her kullanıcı bildirimlerin okundu bilgisini güncelleyebilir (kendi veya global olanlar)
DROP POLICY IF EXISTS "Users can update own or global notifications read status" ON public.bildirimler;
CREATE POLICY "Users can update own or global notifications read status"
ON public.bildirimler FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL)
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Sadece Admin yetkisine sahip e-postalar bildirim oluşturabilir, silebilir ve yönetebilir
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.bildirimler;
CREATE POLICY "Admins can manage notifications"
ON public.bildirimler FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' IN ('wwekaannet@gmail.com', 'admin@autoflow.com', 'kaanclgl@gmail.com'))
WITH CHECK (auth.jwt() ->> 'email' IN ('wwekaannet@gmail.com', 'admin@autoflow.com', 'kaanclgl@gmail.com'));

-- Hızlı sorgular için indeks ekle
CREATE INDEX IF NOT EXISTS idx_bildirimler_user_id ON public.bildirimler(user_id);
CREATE INDEX IF NOT EXISTS idx_bildirimler_created_at ON public.bildirimler(created_at DESC);
