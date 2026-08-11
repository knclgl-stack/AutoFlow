import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"
import { SITE_URL } from "@/lib/site"

export const revalidate = 3600

function safeDate(value?: string | null) {
  if (!value) return new Date()
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? new Date() : date
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/gizlilik`,
      lastModified: new Date("2026-08-11"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ]

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) return routes

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [{ data: galeriler }, { data: araclar }] = await Promise.all([
    supabase.from("galeri_profilleri_public").select("slug, created_at"),
    supabase.from("araclar_public").select("id, qr_slug, created_at, updated_at"),
  ])

  for (const galeri of galeriler || []) {
    if (!galeri.slug) continue
    routes.push({
      url: `${SITE_URL}/galeri/${encodeURIComponent(galeri.slug)}`,
      lastModified: safeDate(galeri.created_at),
      changeFrequency: "daily",
      priority: 0.8,
    })
  }

  for (const arac of araclar || []) {
    const identifier = arac.qr_slug || arac.id
    if (!identifier) continue
    routes.push({
      url: `${SITE_URL}/arac/${encodeURIComponent(identifier)}`,
      lastModified: safeDate(arac.updated_at || arac.created_at),
      changeFrequency: "daily",
      priority: 0.7,
    })
  }

  return routes
}
