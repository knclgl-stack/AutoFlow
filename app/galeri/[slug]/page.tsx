import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { GaleriClient } from "@/components/autoflow/galeri-client"

interface PageProps {
  params: Promise<{ slug: string }>
}

export const dynamic = "force-dynamic"

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
  const { data: araclar, error: araclarError } = await supabase
    .from("araclar_public")
    .select("*")
    .eq("user_id", galeri.user_id)
    .order("created_at", { ascending: false })

  const initialAraclar = araclar || []

  return <GaleriClient galeri={galeri} initialAraclar={initialAraclar} />
}
