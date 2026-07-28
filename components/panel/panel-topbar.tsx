"use client"

import { useState } from "react"
import { Bell, Search, Plus, CheckCircle, Gift } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface PanelTopbarProps {
  baslik?: string
  aciklama?: string
}

export function PanelTopbar({ baslik, aciklama }: PanelTopbarProps) {
  const { user } = useAuth()
  const [bildirimAcik, setBildirimAcik] = useState(false)
  const [okunmamisVar, setOkunmamisVar] = useState(true)

  const adSoyad: string = user?.user_metadata?.ad_soyad || user?.email || ""
  const galeriAdi: string = user?.user_metadata?.galeri_adi || ""
  const initials = adSoyad
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const bildirimler = [
    {
      id: 1,
      title: "Hoş Geldiniz!",
      desc: "AutoFlow sistemine başarıyla kayıt oldunuz.",
      time: "Şimdi",
      icon: CheckCircle,
      iconColor: "text-af-success bg-af-success/10",
    },
    {
      id: 2,
      title: "Pro Plan Deneme",
      desc: "14 günlük ücretsiz Pro Plan denemeniz başladı.",
      time: "Şimdi",
      icon: Gift,
      iconColor: "text-af-accent bg-af-accent/10",
    }
  ]

  const handleBildirimTikla = () => {
    setBildirimAcik(!bildirimAcik)
    setOkunmamisVar(false)
  }

  return (
    <header className="h-16 bg-af-bg/90 backdrop-blur-xl border-b border-af-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Başlık */}
      <div>
        {baslik && <h1 className="text-af-text font-bold text-lg leading-none">{baslik}</h1>}
        {(aciklama || galeriAdi) && (
          <p className="text-af-text-disabled text-xs mt-0.5">
            {galeriAdi ? `Hoş geldiniz, ${galeriAdi}` : aciklama}
          </p>
        )}
      </div>

      {/* Aksiyonlar */}
      <div className="flex items-center gap-3">
        {/* Arama */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-af-text-disabled" />
          <input
            type="text"
            placeholder="Araç ara..."
            className="bg-af-surface border border-af-border text-af-text-secondary placeholder:text-af-text-disabled text-sm rounded-xl pl-9 pr-4 py-2 w-48 focus:outline-none focus:border-af-accent focus:w-64 transition-all duration-300"
          />
        </div>

        {/* Hızlı araç ekle */}
        <Link
          href="/panel/araclar/yeni"
          className="flex items-center gap-1.5 bg-af-accent hover:bg-af-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-af-accent/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Araç Ekle</span>
        </Link>

        {/* Bildirim */}
        <div className="relative">
          <button
            onClick={handleBildirimTikla}
            className="relative w-9 h-9 rounded-xl bg-af-surface border border-af-border flex items-center justify-center text-af-text-secondary hover:text-af-text hover:border-af-border-light transition-all focus:outline-none"
          >
            <Bell className="w-4 h-4" />
            {okunmamisVar && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-af-accent rounded-full" />
            )}
          </button>

          {/* Bildirim Dropdown */}
          {bildirimAcik && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBildirimAcik(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-af-surface border border-af-border rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-af-border pb-3 mb-3">
                  <h4 className="font-bold text-af-text text-sm">Bildirimler</h4>
                  <span className="text-[10px] bg-af-accent/10 text-af-accent px-2 py-0.5 rounded-full font-semibold">Yeni</span>
                </div>
                <div className="space-y-3">
                  {bildirimler.map((b) => (
                    <div key={b.id} className="flex gap-3 p-2 rounded-xl hover:bg-af-surface-2 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${b.iconColor}`}>
                        <b.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-af-text truncate">{b.title}</p>
                        <p className="text-af-text-secondary text-[11px] leading-relaxed mt-0.5">{b.desc}</p>
                        <span className="text-af-text-disabled text-[9px] block mt-1">{b.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar — ayarlara link */}
        <Link
          href="/panel/ayarlar"
          title="Hesap Ayarları"
          className="w-9 h-9 rounded-xl bg-af-accent flex items-center justify-center text-white text-sm font-black cursor-pointer hover:bg-af-accent-hover transition-colors"
        >
          {initials || "?"}
        </Link>
      </div>
    </header>
  )
}
