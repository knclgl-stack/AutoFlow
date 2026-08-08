-- ====================================================================
-- AutoFlow Supabase Master Veritabanı Kurulum Dosyası (All-in-One SQL)
-- ====================================================================
-- Bu dosya tüm tabloları, yeni eklenen kolonları (logo_url, aciklama, muhasebe),
-- RLS güvenlik politikalarını ve index'leri tek adımla kurar.
-- Supabase Dashboard > SQL Editor alanına yapıştırıp "Run" butonuna basmanız yeterlidir.

-- 1. YENİ KOLONLARI EKLEME (Eğer yoksa)
ALTER TABLE public.galeri_profilleri ADD COLUMN IF NOT EXISTS plan text DEFAULT 'Essential';
ALTER TABLE public.galeri_profilleri ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.galeri_profilleri ADD COLUMN IF NOT EXISTS adres text;
ALTER TABLE public.galeri_profilleri ADD COLUMN IF NOT EXISTS telefon text;
ALTER TABLE public.galeri_profilleri ADD COLUMN IF NOT EXISTS calisma_saatleri jsonb DEFAULT '{"hafta_ici": "09:00 - 19:00", "hafta_sonu": "10:00 - 18:00"}';
ALTER TABLE public.galeri_profilleri ADD COLUMN IF NOT EXISTS muhasebe_saglayici text;
ALTER TABLE public.galeri_profilleri ADD COLUMN IF NOT EXISTS muhasebe_api_key text;
ALTER TABLE public.galeri_profilleri ADD COLUMN IF NOT EXISTS muhasebe_api_secret text;
ALTER TABLE public.galeri_profilleri ADD COLUMN IF NOT EXISTS muhasebe_cari_grubu text;

ALTER TABLE public.araclar ADD COLUMN IF NOT EXISTS boyali_parcalar jsonb DEFAULT '[]';
ALTER TABLE public.araclar ADD COLUMN IF NOT EXISTS tramer_kaydi boolean DEFAULT false;
ALTER TABLE public.araclar ADD COLUMN IF NOT EXISTS tramer_detay jsonb DEFAULT '[]';
ALTER TABLE public.araclar ADD COLUMN IF NOT EXISTS agir_hasar_kaydi boolean DEFAULT false;
ALTER TABLE public.araclar ADD COLUMN IF NOT EXISTS aciklama text;

-- 2. FATURA ENTEGRASYON GEÇMİŞİ TABLOSU (Eğer yoksa)
CREATE TABLE IF NOT EXISTS public.fatura_entegrasyon_gecmisi (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  fatura_no text NOT NULL,
  cari text NOT NULL,
  islem_detayi text NOT NULL,
  tutar numeric NOT NULL,
  durum text NOT NULL DEFAULT 'Entegre Edildi',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Aktifleştir
ALTER TABLE public.fatura_entegrasyon_gecmisi ENABLE ROW LEVEL SECURITY;

-- Fatura Politikası (Her kullanıcı kendi faturasını yönetir)
DROP POLICY IF EXISTS "Kullanıcılar kendi fatura geçmişini görebilir" ON public.fatura_entegrasyon_gecmisi;
CREATE POLICY "Kullanıcılar kendi fatura geçmişini görebilir"
ON public.fatura_entegrasyon_gecmisi FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. RLS GÜVENLİK POLİTİKALARI (Araçlar & Galeri Profilleri)

-- RLS'leri aktifleştir
ALTER TABLE public.araclar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeri_profilleri ENABLE ROW LEVEL SECURITY;

-- ── ARAÇLAR TABLOSU POLİTİKALARI ──

-- Herkes araçları görebilir (SELECT)
DROP POLICY IF EXISTS "Allow public select on vehicles" ON public.araclar;
CREATE POLICY "Allow public select on vehicles"
ON public.araclar FOR SELECT
TO public
USING (true);

-- Kullanıcılar araç ekleyebilir (INSERT)
DROP POLICY IF EXISTS "Allow authenticated insert own vehicles" ON public.araclar;
CREATE POLICY "Allow authenticated insert own vehicles"
ON public.araclar FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar ve adminler araç güncelleyebilir (UPDATE)
DROP POLICY IF EXISTS "Admins can update any vehicle" ON public.araclar;
CREATE POLICY "Admins can update any vehicle"
ON public.araclar FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id 
  OR auth.jwt() ->> 'email' IN ('wwekaannet@gmail.com', 'admin@autoflow.com', 'kaanclgl@gmail.com')
)
WITH CHECK (
  auth.uid() = user_id 
  OR auth.jwt() ->> 'email' IN ('wwekaannet@gmail.com', 'admin@autoflow.com', 'kaanclgl@gmail.com')
);

-- Kullanıcılar ve adminler araç silebilir (DELETE)
DROP POLICY IF EXISTS "Admins can delete any vehicle" ON public.araclar;
CREATE POLICY "Admins can delete any vehicle"
ON public.araclar FOR DELETE TO authenticated
USING (
  auth.uid() = user_id 
  OR auth.jwt() ->> 'email' IN ('wwekaannet@gmail.com', 'admin@autoflow.com', 'kaanclgl@gmail.com')
);


-- ── GALERİ PROFİLLERİ TABLOSU POLİTİKALARI ──

-- Herkes galeri profillerini görebilir (SELECT)
DROP POLICY IF EXISTS "Allow public select on gallery profiles" ON public.galeri_profilleri;
CREATE POLICY "Allow public select on gallery profiles"
ON public.galeri_profilleri FOR SELECT
TO public
USING (true);

-- Kullanıcılar kendi profillerini ekleyebilir (INSERT - Kayıt esnasında henüz session oturumu tam oturmadığı durumlar için public yapıldı)
DROP POLICY IF EXISTS "Allow authenticated insert own gallery profile" ON public.galeri_profilleri;
DROP POLICY IF EXISTS "Allow public insert gallery profile" ON public.galeri_profilleri;
CREATE POLICY "Allow public insert gallery profile"
ON public.galeri_profilleri FOR INSERT
TO public
WITH CHECK (true);

-- Kullanıcılar ve adminler profil güncelleyebilir (UPDATE)
DROP POLICY IF EXISTS "Admins can update any gallery" ON public.galeri_profilleri;
CREATE POLICY "Admins can update any gallery"
ON public.galeri_profilleri FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id 
  OR auth.jwt() ->> 'email' IN ('wwekaannet@gmail.com', 'admin@autoflow.com', 'kaanclgl@gmail.com')
)
WITH CHECK (
  auth.uid() = user_id 
  OR auth.jwt() ->> 'email' IN ('wwekaannet@gmail.com', 'admin@autoflow.com', 'kaanclgl@gmail.com')
);

-- Kullanıcılar ve adminler profil silebilir (DELETE)
DROP POLICY IF EXISTS "Admins can delete any gallery" ON public.galeri_profilleri;
CREATE POLICY "Admins can delete any gallery"
ON public.galeri_profilleri FOR DELETE TO authenticated
USING (
  auth.uid() = user_id 
  OR auth.jwt() ->> 'email' IN ('wwekaannet@gmail.com', 'admin@autoflow.com', 'kaanclgl@gmail.com')
);

-- ── QR OKUTMALARI (qr_events) TABLOSU VE POLİTİKALARI ──

CREATE TABLE IF NOT EXISTS public.qr_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  arac_id uuid REFERENCES public.araclar(id) ON DELETE CASCADE,
  device_type text NOT NULL DEFAULT 'desktop',
  whatsapp_tiklamasi boolean DEFAULT false,
  sehir text,
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS'i aktifleştir
ALTER TABLE public.qr_events ENABLE ROW LEVEL SECURITY;

-- Herkes QR okutma kaydı ekleyebilir (INSERT - Müşteriler giriş yapmadan cam kartı okuttuğu için)
DROP POLICY IF EXISTS "Allow public insert on qr_events" ON public.qr_events;
CREATE POLICY "Allow public insert on qr_events"
ON public.qr_events FOR INSERT
TO public
WITH CHECK (true);

-- Herkes QR okutma verilerini okuyabilir (SELECT - Müşteri insert ettikten sonra .select("id").single() yapabilsin diye)
DROP POLICY IF EXISTS "Allow authenticated read own qr_events" ON public.qr_events;
DROP POLICY IF EXISTS "Allow public select on qr_events" ON public.qr_events;
CREATE POLICY "Allow public select on qr_events"
ON public.qr_events FOR SELECT
TO public
USING (true);


-- 4. HIZLI SORGU İNDEKS LERİ
CREATE INDEX IF NOT EXISTS idx_araclar_user_id ON public.araclar(user_id);
CREATE INDEX IF NOT EXISTS idx_araclar_qr_slug ON public.araclar(qr_slug);
CREATE INDEX IF NOT EXISTS idx_galeri_slug ON public.galeri_profilleri(slug);
CREATE INDEX IF NOT EXISTS idx_qr_events_arac_id ON public.qr_events(arac_id);
