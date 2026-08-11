# AutoFlow

Araç galerileri için QR katalog, analitik ve plan bazlı Flow AI uygulaması.

## Yerel kurulum

1. `.env.example` dosyasını `.env.local` olarak kopyalayın ve gerçek değerleri girin.
2. `npm install` çalıştırın.
3. Supabase SQL Editor'da `supabase_production_hardening.sql` dosyasını çalıştırın.
4. Supabase Authentication ayarlarında **Confirm email** seçeneğini etkinleştirin.
5. `npm run dev` ile uygulamayı başlatın.

> `SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucu tarafında kullanılır. İsmi hiçbir zaman
> `NEXT_PUBLIC_` ile başlamamalı ve tarayıcıya gönderilmemelidir.

## Üretime geçiş sırası

1. Supabase yedeği alın.
2. `supabase_production_hardening.sql` migration'ını uygulayın.
3. Migration içindeki `MB Classic Shop` güncellemesinin bir satırı Elite yaptığını kontrol edin.
4. Vercel ortam değişkenlerine `.env.example` içindeki tüm değerleri ekleyin. Özellikle
   `NEXT_PUBLIC_HAVALE_ALICI` ve `NEXT_PUBLIC_HAVALE_IBAN` boşsa ücretli plan talebi
   güvenli biçimde devre dışı kalır.
5. Uygulamayı yayınlayın ve aşağıdaki kontrolleri çalıştırın.

```bash
npm run lint
npm run test
npm run build
```

Eski `supabase_*_migration.sql`, `supabase_admin_policies.sql` ve
`supabase_master_setup.sql` dosyaları geçmiş kurulum dosyalarıdır. Üretim güvenlik
modelinin son kaynağı `supabase_production_hardening.sql` dosyasıdır; eski dosyaları
hardening migration'ından sonra yeniden çalıştırmayın.

## Planlar

| Plan | Araç limiti | Aylık Flow AI kotası |
| --- | ---: | ---: |
| Essential | 3 | Kullanılamaz |
| Professional | 12 | 150 |
| Elite | Sınırsız | 500 |

Ücretli planlar havale talebi ve `wwekaannet@gmail.com` admin hesabının onayıyla
aktifleşir. Kullanıcılar profil tablosundaki `plan` alanını doğrudan değiştiremez.

Onaylanan fiyatlar:

| Plan | Aylık | Yıllık toplam |
| --- | ---: | ---: |
| Professional | ₺2.990 | ₺23.880 |
| Elite | ₺4.990 | ₺35.880 |

## Muhasebe özelliğinin kaldırılması

Arayüz kaldırılmıştır. Hassas muhasebe kolonları hardening migration'ıyla genel
erişime kapatılır. Veritabanı yedeği alındıktan sonra
`supabase_optional_remove_muhasebe_after_backup.sql` ayrıca çalıştırılarak kolonlar
ve eski demo tablo kalıcı olarak silinebilir.
