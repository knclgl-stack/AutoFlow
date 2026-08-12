import type { Metadata } from "next"
import { Cookie } from "lucide-react"
import { PublicPageShell } from "@/components/autoflow/public-page-shell"

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "AutoFlow üzerinde kullanılan zorunlu oturum, güvenlik, analitik ve performans teknolojileri hakkında bilgi.",
  alternates: { canonical: "/cerez-politikasi" },
}

export default function CerezPolitikasiPage() {
  return (
    <PublicPageShell
      eyebrow="Gizlilik"
      title="Çerez Politikası"
      description="Bu metin AutoFlow’un oturum, güvenlik ve performans amaçlı tarayıcı teknolojilerini nasıl kullandığını açıklar."
      icon={<Cookie className="h-6 w-6" />}
    >
      <p className="mb-5 text-xs text-af-text-disabled">Son güncelleme: 12 Ağustos 2026</p>
      <div className="space-y-6 rounded-2xl border border-af-border bg-af-surface p-6 text-sm leading-relaxed text-af-text-secondary sm:p-8">
        <section className="space-y-2">
          <h2 className="font-bold text-white">1. Zorunlu oturum teknolojileri</h2>
          <p>Hesabınıza güvenli biçimde giriş yapabilmeniz, oturumun sürdürülebilmesi ve yetkisiz erişimin engellenmesi için Supabase kimlik doğrulama çerezleri kullanılır. Bu çerezler olmadan panel ve hesap özellikleri düzgün çalışmayabilir.</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-bold text-white">2. Analitik ve performans ölçümü</h2>
          <p>Sayfa performansını ve genel kullanım eğilimlerini anlamak için Vercel Analytics ve Speed Insights kullanılır. Bu ölçümler hizmeti iyileştirmek, hataları tespit etmek ve sayfaların yüklenme performansını izlemek amacıyla değerlendirilir; reklam veya yeniden pazarlama profili oluşturmak için kullanılmaz.</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-bold text-white">3. QR ve araç etkileşim kayıtları</h2>
          <p>Araç sayfalarında QR görüntülenmesi, cihaz türü ve WhatsApp düğmesi etkileşimi gibi olaylar galeri sahibine analitik sunmak amacıyla kaydedilebilir. Bu kayıtlar zorunlu olarak bir kişinin gerçek kimliğiyle eşleştirilmez.</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-bold text-white">4. Tercihlerinizi yönetme</h2>
          <p>Tarayıcınızın ayarlarından çerezleri görüntüleyebilir, silebilir veya engelleyebilirsiniz. Zorunlu çerezleri engellemeniz durumunda giriş ve panel işlevlerinde sorun yaşanabilir.</p>
        </section>
        <section className="space-y-2">
          <h2 className="font-bold text-white">5. İletişim</h2>
          <p>Çerez ve gizlilik uygulamaları hakkındaki sorularınızı <a href="mailto:knclgl@gmail.com" className="font-semibold text-af-accent hover:underline">knclgl@gmail.com</a> adresine gönderebilirsiniz.</p>
        </section>
      </div>
    </PublicPageShell>
  )
}
