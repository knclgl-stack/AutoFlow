import Link from "next/link"
import { AfLogo } from "@/components/autoflow/af-logo"
import { ShieldCheck, ArrowLeft } from "lucide-react"

export default function GizlilikPage() {
  return (
    <div className="min-h-screen bg-af-bg text-af-text">
      {/* Header */}
      <header className="bg-af-surface border-b border-af-border py-4 px-6 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="block">
            <AfLogo variant="sidebar" size={32} />
          </Link>
          <Link
            href="/kayit"
            className="flex items-center gap-1.5 text-xs text-af-text-secondary hover:text-white transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Kayıta Dön
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-af-accent/10 border border-af-accent/20 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-af-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
            <p className="text-af-text-secondary text-xs mt-0.5">Son Güncelleme: 7 Ağustos 2026</p>
          </div>
        </div>

        <div className="bg-af-surface border border-af-border rounded-2xl p-6 sm:p-8 space-y-6 text-sm leading-relaxed text-af-text-secondary">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Veri Sorumlusu Kimliği</h2>
            <p>
              AutoFlow platformu olarak, galeri sahiplerinin ve platform ziyaretçilerinin kişisel verilerinin korunmasına büyük önem veriyoruz. 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, verileriniz işbu aydınlatma metni kapsamında işlenmektedir.
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
              Toplanan tüm kişisel verileriniz ve galeri içerikleriniz uçtan uca şifrelenmiş Supabase veritabanı altyapısında yüksek güvenlik standartları ile saklanmaktadır. Verileriniz izniniz haricinde üçüncü taraflarla reklam veya pazarlama amacıyla paylaşılmaz.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. İletişim ve Haklarınız</h2>
            <p>
              KVKK'nın 11. maddesi kapsamındaki haklarınızı kullanmak, hesabınızı ve verilerinizi tamamen silmek için <a href="mailto:destek@autoflow.com.tr" className="text-af-accent underline">destek@autoflow.com.tr</a> e-posta adresi üzerinden bizlerle 7/24 iletişime geçebilirsiniz.
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
