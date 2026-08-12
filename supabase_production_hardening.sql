-- ============================================================================
-- AutoFlow production hardening migration
-- Run this file in Supabase SQL Editor BEFORE deploying the matching app code.
-- This migration is idempotent and does not delete customer rows.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- Compatibility columns used by the current application.
-- Existing rows remain unchanged because these columns are nullable.
-- --------------------------------------------------------------------------
ALTER TABLE public.araclar
  ADD COLUMN IF NOT EXISTS video_url text;

-- --------------------------------------------------------------------------
-- Central admin identity
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_autoflow_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', '')) = 'wwekaannet@gmail.com';
$$;

REVOKE ALL ON FUNCTION public.is_autoflow_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_autoflow_admin() TO authenticated, service_role;

-- --------------------------------------------------------------------------
-- Safe profile creation for open registration
-- The profile is created by an auth.users trigger, so public INSERT is not needed.
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_autoflow_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  base_slug text;
BEGIN
  base_slug := lower(coalesce(new.raw_user_meta_data ->> 'galeri_slug', ''));
  base_slug := regexp_replace(base_slug, '[^a-z0-9-]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  base_slug := left(base_slug, 60);
  IF base_slug = '' THEN
    base_slug := 'galeri';
  END IF;

  INSERT INTO public.galeri_profilleri (
    user_id,
    galeri_adi,
    slug,
    plan,
    adres,
    telefon,
    calisma_saatleri
  )
  VALUES (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'galeri_adi'), ''), 'Yeni Galeri'), 120),
    base_slug || '-' || substring(replace(new.id::text, '-', '') from 1 for 6),
    'Essential',
    nullif(left(trim(new.raw_user_meta_data ->> 'adres'), 500), ''),
    nullif(left(trim(new.raw_user_meta_data ->> 'telefon'), 40), ''),
    jsonb_build_object(
      'hafta_ici', coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'calisma_hafta_ici'), 40), ''), '09:00 - 19:00'),
      'hafta_sonu', coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'calisma_hafta_sonu'), 40), ''), '10:00 - 18:00')
    )
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_autoflow ON auth.users;
CREATE TRIGGER on_auth_user_created_autoflow
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_autoflow_user();

-- --------------------------------------------------------------------------
-- Bank-transfer subscription requests
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plan_talepleri (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mevcut_plan text NOT NULL,
  talep_edilen_plan text NOT NULL CHECK (talep_edilen_plan IN ('Professional', 'Elite')),
  odeme_periyodu text NOT NULL CHECK (odeme_periyodu IN ('aylik', 'yillik')),
  tutar numeric(12, 2) NOT NULL CHECK (tutar > 0),
  havale_referansi text NOT NULL,
  kullanici_notu text,
  durum text NOT NULL DEFAULT 'bekliyor' CHECK (durum IN ('bekliyor', 'onaylandi', 'reddedildi')),
  admin_notu text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_plan_talepleri_bekleyen_kullanici
  ON public.plan_talepleri(user_id)
  WHERE durum = 'bekliyor';
CREATE INDEX IF NOT EXISTS idx_plan_talepleri_created_at
  ON public.plan_talepleri(created_at DESC);

-- --------------------------------------------------------------------------
-- Monthly AI quota and public daily abuse protection
-- --------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_kullanim_aylik (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  donem_baslangici date NOT NULL,
  kullanilan integer NOT NULL DEFAULT 0 CHECK (kullanilan >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, donem_baslangici)
);

CREATE TABLE IF NOT EXISTS public.ai_public_gunluk_limit (
  istemci_hash text NOT NULL,
  kullanim_tarihi date NOT NULL,
  kullanilan integer NOT NULL DEFAULT 0 CHECK (kullanilan >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (istemci_hash, kullanim_tarihi)
);

CREATE OR REPLACE FUNCTION public.autoflow_ai_limit(plan_name text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE plan_name
    WHEN 'Professional' THEN 150
    WHEN 'Elite' THEN 500
    ELSE 0
  END;
$$;

REVOKE ALL ON FUNCTION public.autoflow_ai_limit(text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.consume_ai_quota()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_plan text;
  monthly_limit integer;
  current_usage integer;
  period_start date := date_trunc('month', timezone('utc', now()))::date;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Oturum gerekli' USING ERRCODE = '42501';
  END IF;

  SELECT plan INTO current_plan
  FROM public.galeri_profilleri
  WHERE user_id = current_user_id;

  monthly_limit := public.autoflow_ai_limit(coalesce(current_plan, 'Essential'));
  IF monthly_limit = 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'plan', 'used', 0, 'limit', 0);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(current_user_id::text || period_start::text, 0));

  SELECT kullanilan INTO current_usage
  FROM public.ai_kullanim_aylik
  WHERE user_id = current_user_id AND donem_baslangici = period_start;
  current_usage := coalesce(current_usage, 0);

  IF current_usage >= monthly_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'monthly', 'used', current_usage, 'limit', monthly_limit);
  END IF;

  INSERT INTO public.ai_kullanim_aylik (user_id, donem_baslangici, kullanilan)
  VALUES (current_user_id, period_start, 1)
  ON CONFLICT (user_id, donem_baslangici)
  DO UPDATE SET kullanilan = public.ai_kullanim_aylik.kullanilan + 1, updated_at = now()
  RETURNING kullanilan INTO current_usage;

  RETURN jsonb_build_object('allowed', true, 'used', current_usage, 'limit', monthly_limit);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ai_quota_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_plan text;
  monthly_limit integer;
  current_usage integer;
  period_start date := date_trunc('month', timezone('utc', now()))::date;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Oturum gerekli' USING ERRCODE = '42501';
  END IF;

  SELECT plan INTO current_plan FROM public.galeri_profilleri WHERE user_id = current_user_id;
  monthly_limit := public.autoflow_ai_limit(coalesce(current_plan, 'Essential'));
  SELECT kullanilan INTO current_usage
  FROM public.ai_kullanim_aylik
  WHERE user_id = current_user_id AND donem_baslangici = period_start;

  RETURN jsonb_build_object(
    'plan', coalesce(current_plan, 'Essential'),
    'used', coalesce(current_usage, 0),
    'limit', monthly_limit
  );
END;
$$;

-- Called only by the server-side service-role client for the public vehicle advisor.
CREATE OR REPLACE FUNCTION public.consume_public_ai_quota(p_arac_id uuid, p_istemci_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  gallery_user_id uuid;
  current_plan text;
  monthly_limit integer;
  monthly_usage integer;
  daily_usage integer;
  period_start date := date_trunc('month', timezone('utc', now()))::date;
  usage_date date := timezone('utc', now())::date;
BEGIN
  IF p_istemci_hash IS NULL OR length(p_istemci_hash) < 16 OR length(p_istemci_hash) > 128 THEN
    RAISE EXCEPTION 'Geçersiz istemci kimliği';
  END IF;

  SELECT user_id INTO gallery_user_id
  FROM public.araclar
  WHERE id = p_arac_id AND durum IN ('Aktif', 'Satildi');

  IF gallery_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'vehicle');
  END IF;

  SELECT plan INTO current_plan
  FROM public.galeri_profilleri
  WHERE user_id = gallery_user_id;
  monthly_limit := public.autoflow_ai_limit(coalesce(current_plan, 'Essential'));

  IF monthly_limit = 0 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'plan', 'used', 0, 'limit', 0);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(p_istemci_hash || usage_date::text, 0));
  SELECT kullanilan INTO daily_usage
  FROM public.ai_public_gunluk_limit
  WHERE istemci_hash = p_istemci_hash AND kullanim_tarihi = usage_date;
  daily_usage := coalesce(daily_usage, 0);

  IF daily_usage >= 20 THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'daily', 'used', daily_usage, 'limit', 20);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(gallery_user_id::text || period_start::text, 0));
  SELECT kullanilan INTO monthly_usage
  FROM public.ai_kullanim_aylik
  WHERE user_id = gallery_user_id AND donem_baslangici = period_start;
  monthly_usage := coalesce(monthly_usage, 0);

  IF monthly_usage >= monthly_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'monthly', 'used', monthly_usage, 'limit', monthly_limit);
  END IF;

  INSERT INTO public.ai_public_gunluk_limit (istemci_hash, kullanim_tarihi, kullanilan)
  VALUES (p_istemci_hash, usage_date, 1)
  ON CONFLICT (istemci_hash, kullanim_tarihi)
  DO UPDATE SET kullanilan = public.ai_public_gunluk_limit.kullanilan + 1, updated_at = now();

  INSERT INTO public.ai_kullanim_aylik (user_id, donem_baslangici, kullanilan)
  VALUES (gallery_user_id, period_start, 1)
  ON CONFLICT (user_id, donem_baslangici)
  DO UPDATE SET kullanilan = public.ai_kullanim_aylik.kullanilan + 1, updated_at = now()
  RETURNING kullanilan INTO monthly_usage;

  RETURN jsonb_build_object('allowed', true, 'used', monthly_usage, 'limit', monthly_limit);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_quota() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_ai_quota_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_public_ai_quota(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_quota_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_public_ai_quota(uuid, text) TO service_role;

-- --------------------------------------------------------------------------
-- Server-side vehicle count enforcement
-- --------------------------------------------------------------------------
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
    SELECT count(*) INTO vehicle_count FROM public.araclar WHERE user_id = new.user_id;
    IF vehicle_count >= vehicle_limit THEN
      RAISE EXCEPTION 'Plan araç limiti doldu (% araç)', vehicle_limit USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS enforce_vehicle_plan_limit_trigger ON public.araclar;
CREATE TRIGGER enforce_vehicle_plan_limit_trigger
  BEFORE INSERT ON public.araclar
  FOR EACH ROW EXECUTE FUNCTION public.enforce_vehicle_plan_limit();

-- --------------------------------------------------------------------------
-- Subscription request functions
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_plan_request(
  p_plan text,
  p_period text,
  p_reference text,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  current_plan text;
  request_amount numeric(12, 2);
  request_id uuid;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Oturum gerekli' USING ERRCODE = '42501';
  END IF;
  IF p_plan NOT IN ('Professional', 'Elite') THEN
    RAISE EXCEPTION 'Geçersiz plan';
  END IF;
  IF p_period NOT IN ('aylik', 'yillik') THEN
    RAISE EXCEPTION 'Geçersiz ödeme periyodu';
  END IF;
  IF length(trim(coalesce(p_reference, ''))) < 3 OR length(p_reference) > 120 THEN
    RAISE EXCEPTION 'Havale referansı 3-120 karakter olmalıdır';
  END IF;
  IF length(coalesce(p_note, '')) > 500 THEN
    RAISE EXCEPTION 'Not en fazla 500 karakter olabilir';
  END IF;

  SELECT plan INTO current_plan
  FROM public.galeri_profilleri
  WHERE user_id = current_user_id;

  IF current_plan IS NULL THEN
    RAISE EXCEPTION 'Galeri profili bulunamadı';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.plan_talepleri
    WHERE user_id = current_user_id AND durum = 'bekliyor'
  ) THEN
    RAISE EXCEPTION 'Zaten değerlendirmede olan bir plan talebiniz var';
  END IF;

  request_amount := CASE
    WHEN p_plan = 'Professional' AND p_period = 'aylik' THEN 2990
    WHEN p_plan = 'Professional' AND p_period = 'yillik' THEN 23880
    WHEN p_plan = 'Elite' AND p_period = 'aylik' THEN 4990
    WHEN p_plan = 'Elite' AND p_period = 'yillik' THEN 35880
  END;

  INSERT INTO public.plan_talepleri (
    user_id, mevcut_plan, talep_edilen_plan, odeme_periyodu,
    tutar, havale_referansi, kullanici_notu
  )
  VALUES (
    current_user_id, current_plan, p_plan, p_period,
    request_amount, trim(p_reference), nullif(trim(coalesce(p_note, '')), '')
  )
  RETURNING id INTO request_id;

  RETURN request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_plan_request(
  p_request_id uuid,
  p_decision text,
  p_admin_note text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  request_row public.plan_talepleri%ROWTYPE;
  new_status text;
BEGIN
  IF NOT public.is_autoflow_admin() THEN
    RAISE EXCEPTION 'Admin yetkisi gerekli' USING ERRCODE = '42501';
  END IF;
  IF p_decision NOT IN ('onaylandi', 'reddedildi') THEN
    RAISE EXCEPTION 'Geçersiz karar';
  END IF;
  IF length(coalesce(p_admin_note, '')) > 500 THEN
    RAISE EXCEPTION 'Admin notu en fazla 500 karakter olabilir';
  END IF;

  SELECT * INTO request_row
  FROM public.plan_talepleri
  WHERE id = p_request_id
  FOR UPDATE;

  IF request_row.id IS NULL OR request_row.durum <> 'bekliyor' THEN
    RAISE EXCEPTION 'Bekleyen talep bulunamadı';
  END IF;

  new_status := p_decision;
  IF new_status = 'onaylandi' THEN
    UPDATE public.galeri_profilleri
    SET plan = request_row.talep_edilen_plan
    WHERE user_id = request_row.user_id;
  END IF;

  UPDATE public.plan_talepleri
  SET durum = new_status,
      admin_notu = nullif(trim(coalesce(p_admin_note, '')), ''),
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = p_request_id;

  INSERT INTO public.bildirimler (user_id, title, description)
  VALUES (
    request_row.user_id,
    CASE WHEN new_status = 'onaylandi' THEN 'Plan talebiniz onaylandı' ELSE 'Plan talebiniz değerlendirildi' END,
    CASE
      WHEN new_status = 'onaylandi' THEN request_row.talep_edilen_plan || ' planınız aktif edildi.'
      ELSE 'Plan talebiniz reddedildi.' || CASE WHEN p_admin_note IS NULL THEN '' ELSE ' Not: ' || p_admin_note END
    END
  );

  RETURN jsonb_build_object('status', new_status, 'plan', request_row.talep_edilen_plan);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_gallery_plan(p_user_id uuid, p_plan text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_autoflow_admin() THEN
    RAISE EXCEPTION 'Admin yetkisi gerekli' USING ERRCODE = '42501';
  END IF;
  IF p_plan NOT IN ('Essential', 'Professional', 'Elite') THEN
    RAISE EXCEPTION 'Geçersiz plan';
  END IF;

  UPDATE public.galeri_profilleri SET plan = p_plan WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_plan_request(text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.review_plan_request(uuid, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_set_gallery_plan(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_plan_request(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_plan_request(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_gallery_plan(uuid, text) TO authenticated;

-- --------------------------------------------------------------------------
-- Safe QR event functions: anonymous visitors never receive direct table access.
-- --------------------------------------------------------------------------
ALTER TABLE public.qr_events ADD COLUMN IF NOT EXISTS event_token uuid DEFAULT gen_random_uuid();

CREATE OR REPLACE FUNCTION public.register_qr_event(p_arac_id uuid, p_device_type text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_id uuid;
  new_token uuid := gen_random_uuid();
BEGIN
  IF p_device_type NOT IN ('mobile', 'tablet', 'desktop') THEN
    RAISE EXCEPTION 'Geçersiz cihaz türü';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.araclar
    WHERE id = p_arac_id AND durum IN ('Aktif', 'Satildi')
  ) THEN
    RAISE EXCEPTION 'Araç bulunamadı';
  END IF;

  INSERT INTO public.qr_events (arac_id, device_type, whatsapp_tiklamasi, event_token)
  VALUES (p_arac_id, p_device_type, false, new_token)
  RETURNING id INTO new_id;

  RETURN jsonb_build_object('id', new_id, 'token', new_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_qr_whatsapp(p_event_id uuid, p_event_token uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.qr_events
  SET whatsapp_tiklamasi = true
  WHERE id = p_event_id AND event_token = p_event_token;
$$;

REVOKE ALL ON FUNCTION public.register_qr_event(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_qr_whatsapp(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_qr_event(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_qr_whatsapp(uuid, uuid) TO anon, authenticated;

-- --------------------------------------------------------------------------
-- Notification read-state function (users cannot edit announcement content).
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Oturum gerekli' USING ERRCODE = '42501';
  END IF;

  UPDATE public.bildirimler
  SET read = true
  WHERE id = p_notification_id AND user_id = current_user_id;

  UPDATE public.bildirimler
  SET read_by = array_append(read_by, current_user_id::text)
  WHERE id = p_notification_id
    AND user_id IS NULL
    AND NOT (current_user_id::text = ANY(read_by));
END;
$$;

REVOKE ALL ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;

-- --------------------------------------------------------------------------
-- Reset table policies to the production allow-list.
-- --------------------------------------------------------------------------
ALTER TABLE public.galeri_profilleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.araclar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bildirimler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_talepleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_kullanim_aylik ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_public_gunluk_limit ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  target_table text;
  policy_row record;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'galeri_profilleri', 'araclar', 'qr_events', 'bildirimler',
    'plan_talepleri', 'ai_kullanim_aylik', 'ai_public_gunluk_limit'
  ]
  LOOP
    FOR policy_row IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = target_table
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_row.policyname, target_table);
    END LOOP;
  END LOOP;
END;
$$;

CREATE POLICY "profiles_select_owner_or_admin"
ON public.galeri_profilleri FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_autoflow_admin());

CREATE POLICY "profiles_insert_admin"
ON public.galeri_profilleri FOR INSERT TO authenticated
WITH CHECK (public.is_autoflow_admin());

CREATE POLICY "profiles_update_owner_or_admin"
ON public.galeri_profilleri FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_autoflow_admin())
WITH CHECK (auth.uid() = user_id OR public.is_autoflow_admin());

CREATE POLICY "profiles_delete_admin"
ON public.galeri_profilleri FOR DELETE TO authenticated
USING (public.is_autoflow_admin());

CREATE POLICY "vehicles_select_owner_or_admin"
ON public.araclar FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_autoflow_admin());

CREATE POLICY "vehicles_insert_owner"
ON public.araclar FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vehicles_update_owner_or_admin"
ON public.araclar FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.is_autoflow_admin())
WITH CHECK (auth.uid() = user_id OR public.is_autoflow_admin());

CREATE POLICY "vehicles_delete_owner_or_admin"
ON public.araclar FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.is_autoflow_admin());

CREATE POLICY "qr_events_select_owner_or_admin"
ON public.qr_events FOR SELECT TO authenticated
USING (
  public.is_autoflow_admin()
  OR EXISTS (
    SELECT 1 FROM public.araclar a
    WHERE a.id = qr_events.arac_id AND a.user_id = auth.uid()
  )
);

CREATE POLICY "notifications_select_visible"
ON public.bildirimler FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL OR public.is_autoflow_admin());

CREATE POLICY "notifications_insert_admin"
ON public.bildirimler FOR INSERT TO authenticated
WITH CHECK (public.is_autoflow_admin());

CREATE POLICY "notifications_delete_admin"
ON public.bildirimler FOR DELETE TO authenticated
USING (public.is_autoflow_admin());

CREATE POLICY "plan_requests_select_owner_or_admin"
ON public.plan_talepleri FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_autoflow_admin());

CREATE POLICY "ai_usage_select_owner_or_admin"
ON public.ai_kullanim_aylik FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_autoflow_admin());

-- Table grants are as important as RLS. Users may edit profile display fields,
-- but never plan or accounting-secret columns.
REVOKE ALL ON public.galeri_profilleri FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.galeri_profilleri TO authenticated;
GRANT UPDATE (
  galeri_adi, slug, logo_url, adres, telefon, sehir,
  whatsapp, instagram, website, calisma_saatleri
) ON public.galeri_profilleri TO authenticated;

REVOKE ALL ON public.araclar FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.araclar TO authenticated;

REVOKE ALL ON public.qr_events FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.qr_events TO authenticated;

REVOKE ALL ON public.bildirimler FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.bildirimler TO authenticated;

REVOKE ALL ON public.plan_talepleri FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.plan_talepleri TO authenticated;

REVOKE ALL ON public.ai_kullanim_aylik FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ai_kullanim_aylik TO authenticated;
REVOKE ALL ON public.ai_public_gunluk_limit FROM PUBLIC, anon, authenticated;

-- --------------------------------------------------------------------------
-- Public views contain only intentionally public data.
-- Views are security-definer by design; underlying tables are not granted to anon.
-- --------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.galeri_profilleri_public
WITH (security_barrier = true, security_invoker = false)
AS
SELECT
  user_id,
  galeri_adi,
  slug,
  sehir,
  adres,
  telefon,
  whatsapp,
  instagram,
  website,
  logo_url,
  calisma_saatleri,
  plan,
  created_at
FROM public.galeri_profilleri;

CREATE OR REPLACE VIEW public.araclar_public
WITH (security_barrier = true, security_invoker = false)
AS
SELECT
  id,
  user_id,
  qr_slug,
  marka,
  model,
  yil,
  versiyon,
  renk,
  motor_hacmi,
  motor_gucu,
  vites,
  yakit,
  kasa_tipi,
  km,
  hasar_kaydi,
  boyali_parca,
  boyali_parcalar,
  tramer_kaydi,
  tramer_detay,
  agir_hasar_kaydi,
  ozellikler,
  fotograflar,
  video_url,
  CASE WHEN fiyat_gizle THEN NULL ELSE fiyat END AS fiyat,
  fiyat_gizle,
  pazarlik_var,
  durum,
  aciklama,
  created_at,
  updated_at
FROM public.araclar
WHERE durum IN ('Aktif', 'Satildi');

REVOKE ALL ON public.galeri_profilleri_public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.araclar_public FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.galeri_profilleri_public TO anon, authenticated, service_role;
GRANT SELECT ON public.araclar_public TO anon, authenticated, service_role;

-- --------------------------------------------------------------------------
-- Storage bucket and owner-scoped write policies
-- --------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'araclar', 'araclar', true, 5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "autoflow_public_vehicle_images" ON storage.objects;
DROP POLICY IF EXISTS "autoflow_owner_upload_vehicle_images" ON storage.objects;
DROP POLICY IF EXISTS "autoflow_owner_update_vehicle_images" ON storage.objects;
DROP POLICY IF EXISTS "autoflow_owner_delete_vehicle_images" ON storage.objects;

CREATE POLICY "autoflow_public_vehicle_images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'araclar');

CREATE POLICY "autoflow_owner_upload_vehicle_images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'araclar'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_autoflow_admin())
);

CREATE POLICY "autoflow_owner_update_vehicle_images"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'araclar'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_autoflow_admin())
)
WITH CHECK (
  bucket_id = 'araclar'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_autoflow_admin())
);

CREATE POLICY "autoflow_owner_delete_vehicle_images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'araclar'
  AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_autoflow_admin())
);

-- Existing launch customer requested by the owner. Exact, case-insensitive match.
UPDATE public.galeri_profilleri
SET plan = 'Elite'
WHERE lower(trim(galeri_adi)) = lower('MB Classic Shop');

COMMIT;
