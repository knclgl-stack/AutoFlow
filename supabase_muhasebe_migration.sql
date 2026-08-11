-- DEPRECATED / ÇALIŞTIRMAYIN
-- Muhasebe arayüzü kaldırılmıştır. İsteğe bağlı temizlik için:
-- supabase_optional_remove_muhasebe_after_backup.sql
DO $$
BEGIN
  RAISE EXCEPTION 'Bu dosya kullanım dışıdır. Muhasebe temizliği gerekiyorsa önce yedek alın.';
END;
$$;
