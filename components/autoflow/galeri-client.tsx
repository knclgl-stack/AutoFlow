"use client"

import { useState } from "react"
import Link from "next/link"
import { MapPin, Clock, Phone, Instagram, Search, SlidersHorizontal, LogOut } from "lucide-react"
import { AracKarti } from "@/components/autoflow/arac-karti"
import { AfLogo } from "@/components/autoflow/af-logo"
import { useAuth } from "@/lib/auth-context"
import { Arac } from "@/lib/types"
import { cn } from "@/lib/utils"

const YAKIT_FILTRELERI = ["Tümü", "Benzin", "Dizel", "Elektrik", "Hybrid", "LPG"]

interface GaleriProfil {
  user_id: string
  galeri_adi: string
  logo_url?: string
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
  plan?: string
}

interface GaleriClientProps {
  galeri: GaleriProfil
  initialAraclar: Arac[]
}

export function GaleriClient({ galeri, initialAraclar }: GaleriClientProps) {
  const { user, signOut } = useAuth()
  const [araclar] = useState<Arac[]>(initialAraclar)
  const [aramaMetni, setAramaMetni] = useState("")
  const [yakitFilter, setYakitFilter] = useState("Tümü")

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
      <div className={cn(
        "bg-af-surface border-b transition-all duration-300",
        galeri.plan === "Elite" 
          ? "border-amber-500/20 bg-gradient-to-b from-amber-950/10 to-af-surface shadow-[0_4px_30px_rgba(245,158,11,0.05)]" 
          : "border-af-border"
      )}>
        <div className="max-w-5xl mx-auto px-5 py-5">
          <div className="flex items-center justify-between mb-5">
            <Link href="/" className="block overflow-hidden cursor-pointer z-10 relative">
              <AfLogo variant="sidebar" />
            </Link>
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/panel"
                  className="bg-af-accent hover:bg-af-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-md shadow-af-accent/15"
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
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/giris"
                  className="text-af-text-secondary hover:text-white text-sm font-medium transition-colors"
                >
                  Giriş Yap
                </Link>
                <Link
                  href="/kayit"
                  className="bg-af-accent hover:bg-af-accent-hover text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-md shadow-af-accent/15"
                >
                  Ücretsiz Başla
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-5">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl flex-shrink-0 transition-all duration-300 overflow-hidden relative border border-white/10",
              galeri.plan === "Elite"
                ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.4)] text-black"
                : "bg-af-accent shadow-xl shadow-af-accent/25"
            )}>
              {galeri.logo_url ? (
                <img src={galeri.logo_url} alt={galeri.galeri_adi} className="w-full h-full object-cover" />
              ) : (
                initials || "G"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1">
                <h1 className="text-2xl font-black text-af-text">{galeri.galeri_adi}</h1>
                {galeri.plan === "Elite" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 text-amber-400 px-2.5 py-0.5 rounded-full w-max">
                    👑 Elite Üye
                  </span>
                )}
                {galeri.plan === "Professional" && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-af-info/10 border border-af-info/25 text-af-info px-2.5 py-0.5 rounded-full w-max">
                    ★ Pro Galeri
                  </span>
                )}
              </div>
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
          <div className={cn(
            "flex gap-6 mt-5 pt-5 border-t",
            galeri.plan === "Elite" ? "border-amber-500/10" : "border-af-border"
          )}>
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
