import type { Metadata } from "next"
import { FileText } from "lucide-react"
import { PublicPageShell } from "@/components/autoflow/public-page-shell"

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "AutoFlow hizmetinin hesap, içerik, plan, ödeme ve kabul edilebilir kullanım koşulları.",
  alternates: { canonical: "/kullanim-kosullari" },
}

const BOLUMLER = [
  {
    title: "1. Hizmetin kapsamı",
    content: "AutoFlow; galerilerin araç bilgilerini yönetmesine, QR kod üretmesine, herkese açık galeri ve araç sayfaları yayınlamasına, uygun planlarda analitik ve Flow AI araçlarını kullanmasına imkân sağlayan web tabanlı bir hizmettir.",
  },
  {
    title: "2. Hesap ve erişim güvenliği",
    content: "Kullanıcı, kayıt sırasında doğru bilgi vermekle ve hesap bilgilerini korumakla sorumludur. Yetkisiz erişim şüphesinde AutoFlow ile gecikmeden iletişime geçilmelidir. Hesap başkasının hukuka aykırı işlemleri için kullandırılamaz.",
  },
  {
    title: "3. Galeri ve araç içerikleri",
    content: "Yayınlanan araç bilgileri, görseller, fiyatlar, hasar ve iletişim bilgilerinin doğruluğu galeri hesabı sahibinin sorumluluğundadır. Üçüncü kişilerin haklarını ihlal eden, yanıltıcı veya hukuka aykırı içerik yayınlanamaz.",
  },
  {
    title: "4. Planlar ve ödeme",
    content: "Essential plan 3 araçla ücretsizdir. Professional plan 30 araç ve ayda 150 Flow AI işlemi, Elite plan sınırsız araç ve ayda 500 Flow AI işlemi içerir. Ücretli planlar mevcut aşamada havale talebi ve yönetici onayı sonrasında aktive edilir. Güncel kapsam ve ücretler talep ekranında gösterilir.",
  },
  {
    title: "5. Flow AI kullanımı",
    content: "Flow AI tarafından oluşturulan görseller ve yanıtlar otomatik üretimdir. Kullanıcı, yayınlamadan önce doğruluk ve uygunluk kontrolü yapmalıdır. AI çıktıları ekspertiz, hukuki görüş veya satış garantisi değildir.",
  },
  {
    title: "6. Kabul edilebilir kullanım",
    content: "Hizmet; sistemi zorlamak, güvenliği aşmak, zararlı dosya yüklemek, yetkisiz veri toplamak, spam üretmek veya üçüncü kişilere zarar vermek amacıyla kullanılamaz. Bu tür durumlarda erişim geçici olarak sınırlandırılabilir veya hesap kapatılabilir.",
  },
  {
    title: "7. Süreklilik ve değişiklikler",
    content: "Hizmetin güvenliği ve geliştirilmesi için bakım yapılabilir. Kesintisiz veya hatasız çalışma garantisi verilmez; makul ölçüde süreklilik ve veri güvenliği sağlanması hedeflenir. Koşullar değiştiğinde bu sayfadaki güncelleme tarihi yenilenir.",
  },
  {
    title: "8. İletişim",
    content: "Kullanım koşulları, planlar veya hesap işlemleri hakkındaki talepler knclgl@gmail.com adresine gönderilebilir.",
  },
]

export default function KullanimKosullariPage() {
  return (
    <PublicPageShell
      eyebrow="Yasal"
      title="Kullanım Koşulları"
      description="AutoFlow hesabı oluşturarak veya hizmeti kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız."
      icon={<FileText className="h-6 w-6" />}
    >
      <p className="mb-5 text-xs text-af-text-disabled">Son güncelleme: 12 Ağustos 2026</p>
      <div className="space-y-4 rounded-2xl border border-af-border bg-af-surface p-6 sm:p-8">
        {BOLUMLER.map((bolum) => (
          <section key={bolum.title} className="space-y-2">
            <h2 className="text-base font-bold text-white">{bolum.title}</h2>
            <p className="text-sm leading-relaxed text-af-text-secondary">{bolum.content}</p>
          </section>
        ))}
      </div>
    </PublicPageShell>
  )
}
