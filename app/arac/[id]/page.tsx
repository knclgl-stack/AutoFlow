import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AracDetayClient } from "@/components/autoflow/arac-detay-client"
import { JsonLd } from "@/components/seo/json-ld"
import { absoluteUrl, isHttpUrl, SITE_NAME } from "@/lib/site"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  // id'ye ya da qr_slug'a göre aracı getir
  const { data: arac } = await (isUuid
    ? supabase.from("araclar_public").select("*").eq("id", id).single()
    : supabase.from("araclar_public").select("*").eq("qr_slug", id).single())

  if (!arac) {
    return { title: "Araç Bulunamadı", robots: { index: false, follow: false } }
  }

  // Aracın sahibinin galeri bilgilerini getir
  const { data: galeri } = await supabase
    .from("galeri_profilleri_public")
    .select("*")
    .eq("user_id", arac.user_id)
    .single()

  const galeriAdi = galeri?.galeri_adi || "AutoFlow Galerisi"
  const baslik = [arac.yil, arac.marka, arac.model, arac.versiyon].filter(Boolean).join(" ")
  const km = Number(arac.km || 0).toLocaleString("tr-TR")
  const aciklama = `${km} km · ${arac.yakit} · ${arac.vites} — ${galeriAdi}`
  const canonical = `/arac/${arac.qr_slug || arac.id}`
  const images = Array.isArray(arac.fotograflar)
    ? arac.fotograflar.filter(isHttpUrl).slice(0, 4)
    : []
  if (images.length === 0) images.push("/og.png")

  return {
    title: `${baslik} — ${galeriAdi}`,
    description: aciklama,
    alternates: { canonical },
    openGraph: {
      title: baslik,
      description: aciklama,
      url: canonical,
      siteName: SITE_NAME,
      locale: "tr_TR",
      images,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: baslik, description: aciklama, images },
  }
}

export default async function AracDetayPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  // id'ye ya da qr_slug'a göre aracı getir
  const { data: arac, error: aracError } = await (isUuid
    ? supabase.from("araclar_public").select("*").eq("id", id).single()
    : supabase.from("araclar_public").select("*").eq("qr_slug", id).single())

  if (aracError || !arac) {
    notFound()
  }

  // Aracın sahibinin galeri bilgilerini getir
  const { data: galeri, error: galeriError } = await supabase
    .from("galeri_profilleri_public")
    .select("*")
    .eq("user_id", arac.user_id)
    .single()

  if (galeriError || !galeri) {
    notFound()
  }

  // Galeri modelindeki 'galeri_adi' alanını arayüzün beklediği 'ad' alanına eşleyelim
  const mappedGaleri = {
    ...galeri,
    ad: galeri.galeri_adi,
  }

  const canonicalPath = `/arac/${arac.qr_slug || arac.id}`
  const productName = [arac.yil, arac.marka, arac.model, arac.versiyon].filter(Boolean).join(" ")
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["Product", "Vehicle"],
    "@id": `${absoluteUrl(canonicalPath)}#vehicle`,
    name: productName,
    url: absoluteUrl(canonicalPath),
    sku: arac.id,
    image: Array.isArray(arac.fotograflar) ? arac.fotograflar.filter(isHttpUrl) : [],
    description: arac.aciklama || `${productName}, ${Number(arac.km || 0).toLocaleString("tr-TR")} km, ${arac.yakit}, ${arac.vites}.`,
    brand: { "@type": "Brand", name: arac.marka },
    model: arac.model,
    vehicleModelDate: String(arac.yil),
    color: arac.renk,
    fuelType: arac.yakit,
    vehicleTransmission: arac.vites,
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: Number(arac.km || 0),
      unitCode: "KMT",
    },
    itemCondition: "https://schema.org/UsedCondition",
    offers: !arac.fiyat_gizle && arac.fiyat
      ? {
          "@type": "Offer",
          price: Number(arac.fiyat),
          priceCurrency: "TRY",
          availability: arac.durum === "Aktif"
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          url: absoluteUrl(canonicalPath),
          seller: {
            "@type": "AutoDealer",
            name: galeri.galeri_adi,
            url: absoluteUrl(`/galeri/${galeri.slug}`),
          },
        }
      : undefined,
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <AracDetayClient arac={arac} galeri={mappedGaleri} />
    </>
  )
}
