import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AracDetayClient } from "@/components/autoflow/arac-detay-client"
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
    return { title: "Araç Bulunamadı — AutoFlow" }
  }

  // Aracın sahibinin galeri bilgilerini getir
  const { data: galeri } = await supabase
    .from("galeri_profilleri_public")
    .select("*")
    .eq("user_id", arac.user_id)
    .single()

  const galeriAdi = galeri?.galeri_adi || "AutoFlow Galerisi"
  const baslik = `${arac.yil} ${arac.marka} ${arac.model} ${arac.versiyon}`
  const aciklama = `${arac.km.toLocaleString("tr-TR")} km · ${arac.yakit} · ${arac.vites} — ${galeriAdi}`

  return {
    title: `${baslik} — ${galeriAdi}`,
    description: aciklama,
    openGraph: {
      title: baslik,
      description: aciklama,
      images: arac.fotograflar[0] ? [arac.fotograflar[0]] : [],
      type: "website",
    },
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

  return <AracDetayClient arac={arac} galeri={mappedGaleri} />
}
