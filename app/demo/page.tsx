import type { Metadata } from "next"
import Link from "next/link"
import { Car, ExternalLink, MonitorSmartphone, QrCode, Sparkles } from "lucide-react"
import { AracKarti } from "@/components/autoflow/arac-karti"
import { PublicPageShell } from "@/components/autoflow/public-page-shell"
import { JsonLd } from "@/components/seo/json-ld"
import { createClient } from "@/lib/supabase/server"
import { absoluteUrl } from "@/lib/site"
import type { Arac } from "@/lib/types"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Canlı Demo — QR Vitrini ve Flow AI",
  description: "AutoFlow’un canlı galeri vitrini, araç detay sayfası, QR deneyimi ve Flow AI danışmanını müşteri gözüyle inceleyin.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "AutoFlow Canlı Demo",
    description: "QR kodlu dijital araç vitrini ve Flow AI müşteri deneyimini canlı inceleyin.",
    url: "/demo",
  },
}

const ADIMLAR = [
  { icon: MonitorSmartphone, title: "Galeri vitrinini açın", text: "Müşterinin markanız, iletişim bilgileriniz ve aktif araçlarınızla karşılaştığı mobil sayfayı görün." },
  { icon: QrCode, title: "Bir aracı inceleyin", text: "QR sonrasında açılan fotoğraf, teknik bilgi, fiyat ve WhatsApp akışını test edin." },
  { icon: Sparkles, title: "Flow AI’a soru sorun", text: "Uygun planlı galerilerin araç sayfasındaki AI danışmanına tramer, donanım veya pazarlık hakkında sorun." },
]

export default async function DemoPage() {
  const supabase = await createClient()
  const { data: galeri } = await supabase
    .from("galeri_profilleri_public")
    .select("*")
    .eq("slug", "mb-classic-shop")
    .maybeSingle()

  const { data: araclar } = galeri
    ? await supabase
        .from("araclar_public")
        .select("*")
        .eq("user_id", galeri.user_id)
        .eq("durum", "Aktif")
        .order("created_at", { ascending: false })
        .limit(3)
    : { data: [] }

  const demoAraclar = (araclar || []) as Arac[]
  const ilkArac = demoAraclar[0]
  const galeriHref = "/galeri/mb-classic-shop"
  const aracHref = ilkArac ? `/arac/${ilkArac.qr_slug || ilkArac.id}` : galeriHref
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "AutoFlow Canlı Demo",
    url: absoluteUrl("/demo"),
    description: "AutoFlow QR vitrini ve Flow AI araç danışmanı canlı ürün deneyimi.",
    isPartOf: { "@id": `${absoluteUrl("/")}#website` },
  }

  return (
    <PublicPageShell
      eyebrow="Canlı ürün deneyimi"
      title="Müşterinizin Göreceği Akışı Şimdi Deneyin"
      description="Kayıt olmadan gerçek bir galeri vitrininin ve araç sayfasının nasıl çalıştığını inceleyin. MB Classic Shop herkese açık canlı demo galerimizdir."
      icon={<MonitorSmartphone className="h-6 w-6" />}
      wide
    >
      <JsonLd data={jsonLd} />

      <div className="grid gap-5 md:grid-cols-3">
        {ADIMLAR.map(({ icon: Icon, title, text }, index) => (
          <div key={title} className="rounded-2xl border border-af-border bg-af-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-af-accent/10 text-af-accent">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-3xl font-black text-af-accent/15">0{index + 1}</span>
            </div>
            <h2 className="font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-af-text-secondary">{text}</p>
          </div>
        ))}
      </div>

      <section className="mt-8 overflow-hidden rounded-3xl border border-af-accent/25 bg-gradient-to-br from-af-accent/10 via-af-surface to-af-surface p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-400">Elite Demo</span>
              <span className="rounded-full border border-af-border bg-af-bg/60 px-3 py-1 text-xs text-af-text-secondary">{demoAraclar.length} aktif araç örneği</span>
            </div>
            <h2 className="text-2xl font-black text-white">{galeri?.galeri_adi || "MB Classic Shop"}</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-af-text-secondary">
              Galeri sayfasını açın, araçları filtreleyin ve müşterinin doğrudan arama veya WhatsApp iletişimine nasıl geçtiğini görün.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={galeriHref} className="inline-flex items-center justify-center gap-2 rounded-xl bg-af-accent px-5 py-3 text-sm font-bold text-white hover:bg-af-accent-hover">
              Galeri Vitrinini Aç <ExternalLink className="h-4 w-4" />
            </Link>
            <Link href={aracHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-af-border bg-af-bg/60 px-5 py-3 text-sm font-bold text-white hover:border-af-accent/40">
              Araç Sayfasını Aç <Car className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {demoAraclar.length > 0 && (
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-af-accent">Canlı araçlar</p>
              <h2 className="mt-2 text-2xl font-black text-white">Bir araç seçip deneyin</h2>
            </div>
            <Link href={galeriHref} className="text-sm font-semibold text-af-accent hover:underline">Tümünü gör</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {demoAraclar.map((arac) => <AracKarti key={arac.id} arac={arac} />)}
          </div>
        </section>
      )}

      <div className="mt-12 rounded-2xl border border-af-border bg-af-surface p-7 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-af-accent" />
        <h2 className="mt-3 text-xl font-black text-white">Kendi galerinizle denemeye hazır mısınız?</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-af-text-secondary">Essential planla 3 aracınızı ücretsiz yayınlayın. Kredi kartı bilgisi istenmez.</p>
        <Link href="/kayit" className="mt-5 inline-flex rounded-xl bg-af-accent px-6 py-3 text-sm font-bold text-white hover:bg-af-accent-hover">Ücretsiz Galerinizi Oluşturun</Link>
      </div>
    </PublicPageShell>
  )
}
