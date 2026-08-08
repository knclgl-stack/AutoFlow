-- ====================================================================
-- AutoFlow Fatura ve Muhasebe SQL Göçü (Migration)
-- ====================================================================

-- 1. Fatura Entegrasyon Geçmişi Tablosu Oluşturma
CREATE TABLE IF NOT EXISTS public.fatura_entegrasyon_gecmisi (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    fatura_no text NOT NULL,
    cari text NOT NULL,
    islem_detayi text NOT NULL,
    tutar numeric NOT NULL,
    durum text DEFAULT 'Entegre Edildi',
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Row Level Security (RLS) Etkinleştirme
ALTER TABLE public.fatura_entegrasyon_gecmisi ENABLE ROW LEVEL SECURITY;

-- 3. Yetki Politikaları (Policies) Tanımlama
DROP POLICY IF EXISTS "Kullanıcılar kendi fatura geçmişini görebilir" ON public.fatura_entegrasyon_gecmisi;
CREATE POLICY "Kullanıcılar kendi fatura geçmişini görebilir"
ON public.fatura_entegrasyon_gecmisi
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcılar fatura geçmişi ekleyebilir" ON public.fatura_entegrasyon_gecmisi;
CREATE POLICY "Kullanıcılar fatura geçmişi ekleyebilir"
ON public.fatura_entegrasyon_gecmisi
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 4. Galeri Profillerine Entegrasyon Ayarları Kolonlarını Ekleme
ALTER TABLE public.galeri_profilleri 
ADD COLUMN IF NOT EXISTS muhasebe_saglayici text DEFAULT 'parasut',
ADD COLUMN IF NOT EXISTS muhasebe_api_key text,
ADD COLUMN IF NOT EXISTS muhasebe_api_secret text,
ADD COLUMN IF NOT EXISTS muhasebe_cari_grubu text DEFAULT 'Araç Alım-Satım Carileri';
