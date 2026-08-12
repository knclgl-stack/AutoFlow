import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"
import { PublicPageShell } from "@/components/autoflow/public-page-shell"

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni",
  description: "AutoFlow gizlilik politikası, kişisel verilerin işlenmesi ve KVKK kapsamındaki haklarınız.",
  alternates: { canonical: "/gizlilik" },
}

export default function GizlilikPage() {
  return (
    <PublicPageShell
      eyebrow="Gizlilik"
      title="Gizlilik Politikası ve KVKK Aydınlatma Metni"
      description="AutoFlow üzerinde kişisel verilerin hangi amaçlarla işlendiğini, nasıl korunduğunu ve KVKK kapsamındaki haklarınızı açıklar."
      icon={<ShieldCheck className="h-6 w-6" />}
    >
        <p className="mb-5 text-xs text-af-text-disabled">Son güncelleme: 11 Ağustos 2026</p>
        <div className="bg-af-surface border border-af-border rounded-2xl p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-af-text-secondary">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Veri Sorumlusu Kimliği</h2>
            <p>
              AutoFlow hizmetinin veri sorumlusu Abdullah Kaan Çoloğlu'dur. Galeri sahiplerinin ve platform ziyaretçilerinin kişisel verileri, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında işlenmektedir. Veri sorumlusuna <a href="mailto:knclgl@gmail.com" className="text-af-accent underline">knclgl@gmail.com</a> adresinden ulaşabilirsiniz.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. İşlenen Kişisel Veriler ve Amaçları</h2>
            <p>Platformumuz üzerinden toplanan kişisel verileriniz şunlardır:</p>
            <ul className="list-disc pl-5 space-y-1 text-af-text font-medium">
              <li><strong>Kimlik ve İletişim Bilgileri:</strong> Ad-soyad, e-posta adresi, telefon numarası (Hesap oluşturma ve iletişim sağlamak amacıyla).</li>
              <li><strong>Galeri & İlan Bilgileri:</strong> Galeri adı, adresi, ilan görselleri ve araç bilgileri (Galerinizin vitrin sayfasında ve QR kodlarında yayınlamak amacıyla).</li>
              <li><strong>Cihaz & Log Bilgileri:</strong> QR okutma istatistikleri, cihaz tipi ve erişim zamanları (Analitik raporlar oluşturmak amacıyla).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Verilerin Saklanması ve Güvenliği</h2>
            <p>
              Kişisel verileriniz ve galeri içerikleriniz Supabase altyapısında; aktarım şifrelemesi, kimlik doğrulama ve satır seviyesinde erişim kuralları kullanılarak saklanır. Verileriniz izniniz haricinde üçüncü taraflarla reklam veya pazarlama amacıyla paylaşılmaz.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. İletişim ve Haklarınız</h2>
            <p>
              KVKK'nın 11. maddesi kapsamındaki haklarınızı kullanmak veya hesabınızın ve verilerinizin silinmesini talep etmek için <a href="mailto:knclgl@gmail.com" className="text-af-accent underline">knclgl@gmail.com</a> e-posta adresi üzerinden iletişime geçebilirsiniz.
            </p>
          </section>
        </div>
    </PublicPageShell>
  )
}
