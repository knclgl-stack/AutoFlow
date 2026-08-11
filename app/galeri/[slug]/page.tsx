import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { GaleriClient } from "@/components/autoflow/galeri-client"
import { JsonLd } from "@/components/seo/json-ld"
import { absoluteUrl, isHttpUrl, SITE_NAME } from "@/lib/site"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: galeri } = await supabase
    .from("galeri_profilleri_public")
    .select("galeri_adi, slug, sehir, adres, logo_url")
    .eq("slug", slug)
    .single()

  if (!galeri) {
    return { title: "Galeri Bulunamadı", robots: { index: false, follow: false } }
  }

  const title = `${galeri.galeri_adi} Araç İlanları`
  const location = [galeri.adres, galeri.sehir].filter(Boolean).join(", ")
  const description = `${galeri.galeri_adi}${location ? ` (${location})` : ""} tarafından yayınlanan güncel araçları, fotoğrafları ve araç detaylarını inceleyin.`
  const canonical = `/galeri/${galeri.slug}`
  const images = isHttpUrl(galeri.logo_url) ? [galeri.logo_url] : ["/og.png"]

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: SITE_NAME,
      url: canonical,
      title,
      description,
      images,
    },
    twitter: { card: "summary_large_image", title, description, images },
  }
}

export default async function GaleriPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. Slug'a göre galeriyi getir
  const { data: galeri, error: galeriError } = await supabase
    .from("galeri_profilleri_public")
    .select("*")
    .eq("slug", slug)
    .single()

  if (galeriError || !galeri) {
    notFound()
  }

  // 2. Galerinin araçlarını getir
  const { data: araclar } = await supabase
    .from("araclar_public")
    .select("*")
    .eq("user_id", galeri.user_id)
    .order("created_at", { ascending: false })

  const initialAraclar = araclar || []

  const instagramUrl = galeri.instagram
    ? galeri.instagram.startsWith("http")
      ? galeri.instagram
      : `https://instagram.com/${galeri.instagram.replace(/^@/, "")}`
    : undefined
  const sameAs = [galeri.website, instagramUrl].filter(
    (value): value is string => Boolean(value)
  )
  const galeriUrl = absoluteUrl(`/galeri/${galeri.slug}`)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${galeriUrl}#business`,
    name: galeri.galeri_adi,
    url: galeriUrl,
    image: isHttpUrl(galeri.logo_url) ? galeri.logo_url : undefined,
    telephone: galeri.telefon || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: galeri.adres || undefined,
      addressLocality: galeri.sehir || undefined,
      addressCountry: "TR",
    },
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  }

  return (
    <>
      <JsonLd data={jsonLd} />
      <GaleriClient galeri={galeri} initialAraclar={initialAraclar} />
    </>
  )
}
