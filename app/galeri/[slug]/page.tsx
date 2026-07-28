"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { MapPin, Clock, Phone, Instagram, Search, SlidersHorizontal, Car, LogOut } from "lucide-react"
import { AracKarti } from "@/components/autoflow/arac-karti"
import { AfLogo } from "@/components/autoflow/af-logo"
import { notFound } from "next/navigation"
import { Arac } from "@/lib/types"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"

interface PageProps { params: Promise<{ slug: string }> }

const YAKIT_FILTRELERI = ["Tümü", "Benzin", "Dizel", "Elektrik", "Hybrid", "LPG"]

interface GaleriProfil {
  user_id: string
  galeri_adi: string
  slug: string
  adres: string
  sehir: string
  telefon: string
  whatsapp?: string
  instagram?: string
  website?: string
  calisma_saatleri?: {
    hafta_ici?: string
    hafta_sonu?: string
  }
}

export default function GaleriPage({ params }: PageProps) {
  const { slug } = use(params)
  const supabase = createClient()
  const { user, signOut } = useAuth()

  const [galeri, setGaleri] = useState<GaleriProfil | null>(null)
  const [araclar, setAraclar] = useState<Arac[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [bulunamadi, setBulunamadi] = useState(false)

  const [aramaMetni, setAramaMetni] = useState("")
  const [yakitFilter, setYakitFilter] = useState("Tümü")

  useEffect(() => {
    async function galeriVeriGetir() {
      try {


        // 1. Slug'a göre galeriyi getir
        const { data: galeriData, error: galeriError } = await supabase
          .from("galeri_profilleri")
          .select("*")
          .eq("slug", slug)
          .single()

        if (galeriError || !galeriData) {
          setBulunamadi(true)
          setYukleniyor(false)
          return
        }

        const profile = galeriData as GaleriProfil
        setGaleri(profile)

        // 2. Galerinin araçlarını getir
        const { data: araclarData, error: araclarError } = await supabase
          .from("araclar")
          .select("*")
          .eq("user_id", profile.user_id)
          .order("created_at", { ascending: false })

        if (!araclarError) {
          setAraclar((araclarData as Arac[]) || [])
        }
      } catch (err) {
        console.error("Galeri bilgileri çekilirken hata:", err)
        setBulunamadi(true)
      } finally {
        setYukleniyor(false)
      }
    }

    galeriVeriGetir()
  }, [slug])

  if (bulunamadi) {
    notFound()
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-af-bg flex items-center justify-center">
        <span className="w-10 h-10 border-4 border-af-accent/30 border-t-af-accent rounded-full animate-spin" />
      </div>
    )
  }

  if (!galeri) return null

  const aktifAraclar = araclar.filter((a) => a.durum === "Aktif")
  const satilanAraclar = araclar.filter((a) => a.durum === "Satildi")

  const filtrelenmis = aktifAraclar.filter((a: Arac) => {
    const aramaUyumu = aramaMetni === "" || `${a.marka} ${a.model} ${a.versiyon}`.toLowerCase().includes(aramaMetni.toLowerCase())
    const yakitUyumu = yakitFilter === "Tümü" || a.yakit === yakitFilter
    return aramaUyumu && yakitUyumu
  })

  const initials = galeri.galeri_adi
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="min-h-screen bg-af-bg text-af-text">
      <div className="bg-af-surface border-b border-af-border">
        <div className="max-w-5xl mx-auto px-5 py-5">
          <div className="flex items-center justify-between mb-5">
            <Link href="/"><AfLogo variant="sidebar" /></Link>
            {user && (
              <div className="flex items-center gap-3">
                <Link
                  href="/panel"
                  className="bg-af-accent hover:bg-af-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Panele Gir
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 text-af-text-disabled hover:text-af-text text-sm font-medium transition-colors group"
                >
                  <LogOut className="w-4 h-4 text-af-text-disabled group-hover:text-af-text transition-colors" />
                  <span className="hidden sm:block">Çıkış Yap</span>
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-af-accent flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-af-accent/25 flex-shrink-0">
              {initials || "G"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-af-text">{galeri.galeri_adi}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                <span className="flex items-center gap-1.5 text-af-text-secondary text-sm">
                  <MapPin className="w-3.5 h-3.5 text-af-text-disabled" />
                  {galeri.adres || "Adres belirtilmemiş"}{galeri.sehir ? `, ${galeri.sehir}` : ""}
                </span>
                <span className="flex items-center gap-1.5 text-af-text-secondary text-sm">
                  <Clock className="w-3.5 h-3.5 text-af-text-disabled" />
                  {galeri.calisma_saatleri?.hafta_ici || "09:00 - 19:00"}
                </span>
              </div>
            </div>
            <div className="hidden sm:flex gap-2 flex-shrink-0">
              {galeri.telefon && (
                <a href={`tel:${galeri.telefon.replace(/\s/g, "")}`} className="flex items-center gap-2 bg-af-accent hover:bg-af-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  <Phone className="w-4 h-4" />Ara
                </a>
              )}
              {galeri.instagram && (
                <a href={`https://instagram.com/${galeri.instagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 border border-af-border hover:bg-af-surface-2 text-af-text-secondary text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                  <Instagram className="w-4 h-4" />Instagram
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-6 mt-5 pt-5 border-t border-af-border">
            <div><span className="text-2xl font-black text-af-accent">{aktifAraclar.length}</span><span className="text-af-text-secondary text-sm ml-1.5">Aktif Araç</span></div>
            <div className="w-px bg-af-border" />
            <div><span className="text-2xl font-black text-af-text-disabled">{satilanAraclar.length}</span><span className="text-af-text-secondary text-sm ml-1.5">Satılan</span></div>
            <div className="w-px bg-af-border" />
            <div><span className="text-2xl font-black text-af-text">{araclar.length}</span><span className="text-af-text-secondary text-sm ml-1.5">Toplam</span></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
            <input type="text" placeholder="Marka, model ara..." value={aramaMetni} onChange={(e) => setAramaMetni(e.target.value)}
              className="w-full bg-af-surface border border-af-border text-af-text placeholder:text-af-text-disabled rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-af-accent transition-colors" />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {YAKIT_FILTRELERI.map((y) => (
              <button key={y} onClick={() => setYakitFilter(y)}
                className={cn("px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                  yakitFilter === y ? "bg-af-accent text-white border-af-accent" : "bg-af-surface text-af-text-secondary border-af-border hover:border-af-accent/30"
                )}>{y}</button>
            ))}
          </div>
        </div>

        {filtrelenmis.length > 0 ? (
          <>
            <p className="text-sm text-af-text-disabled mb-4">{filtrelenmis.length} araç listeleniyor</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtrelenmis.map((arac) => <AracKarti key={arac.id} arac={arac} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <SlidersHorizontal className="w-12 h-12 text-af-text-disabled mx-auto mb-3" />
            <p className="text-af-text-secondary font-medium">Filtreye uyan araç bulunamadı</p>
          </div>
        )}

        {satilanAraclar.length > 0 && (
          <div className="mt-12">
            <h2 className="font-bold text-af-text-disabled text-sm uppercase tracking-wider mb-4">Satılan Araçlar ({satilanAraclar.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 opacity-50">
              {satilanAraclar.map((arac) => <AracKarti key={arac.id} arac={arac} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
