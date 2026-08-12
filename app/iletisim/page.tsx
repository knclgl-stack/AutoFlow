import type { Metadata } from "next"
import Link from "next/link"
import { Building2, Mail, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react"
import { PublicPageShell } from "@/components/autoflow/public-page-shell"

export const metadata: Metadata = {
  title: "İletişim ve Destek",
  description: "AutoFlow ürün, üyelik, ödeme, teknik destek ve KVKK talepleri için iletişim bilgileri.",
  alternates: { canonical: "/iletisim" },
}

const KONULAR = [
  { icon: Sparkles, title: "Ürün ve demo", text: "Flow AI, QR vitrini ve galeri sayfaları hakkında bilgi alın." },
  { icon: Building2, title: "Plan ve ödeme", text: "Professional veya Elite plan talepleriniz için bize ulaşın." },
  { icon: ShieldCheck, title: "Gizlilik ve hesap", text: "KVKK başvuruları, veri veya hesap silme taleplerinizi iletin." },
]

export default function IletisimPage() {
  return (
    <PublicPageShell
      eyebrow="İletişim"
      title="AutoFlow Ekibine Ulaşın"
      description="Ürün, canlı demo, plan yükseltme veya teknik destek hakkında sorularınızı doğrudan iletebilirsiniz. Mesajlar sırayla incelenir ve e-posta üzerinden yanıtlanır."
      icon={<MessageSquareText className="h-6 w-6" />}
    >
      <div className="grid gap-5 md:grid-cols-3">
        {KONULAR.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-2xl border border-af-border bg-af-surface p-6">
            <Icon className="mb-4 h-5 w-5 text-af-accent" />
            <h2 className="font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-af-text-secondary">{text}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-af-accent/25 bg-af-accent/5 p-6 sm:p-8">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-af-accent">Destek e-postası</p>
            <a href="mailto:knclgl@gmail.com" className="mt-2 block text-xl font-black text-white hover:text-af-accent">
              knclgl@gmail.com
            </a>
            <p className="mt-2 text-sm text-af-text-secondary">Mesajınıza galeri adınızı ve destek konusunu eklemeniz yeterlidir.</p>
          </div>
          <a
            href="mailto:knclgl@gmail.com?subject=AutoFlow%20Destek%20Talebi"
            className="inline-flex items-center gap-2 rounded-xl bg-af-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-af-accent-hover"
          >
            <Mail className="h-4 w-4" /> E-posta Gönder
          </a>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-af-text-disabled">
        Önce ürünü görmek isterseniz <Link href="/demo" className="font-semibold text-af-accent hover:underline">canlı demoyu inceleyin</Link>.
      </p>
    </PublicPageShell>
  )
}
