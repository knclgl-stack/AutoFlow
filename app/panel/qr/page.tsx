"use client"

import { useEffect, useState } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import { QrDisplay } from "@/components/autoflow/qr-display"
import { DurumRozeti } from "@/components/autoflow/durum-rozeti"
import { formatKm } from "@/lib/arac-helpers"
import { Search, QrCode, Plus, Car } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { Arac } from "@/lib/types"

export default function QrPage() {
  const { user } = useAuth()
  const supabase = createClient()

  const [araclar, setAraclar] = useState<Arac[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [aramaMetni, setAramaMetni] = useState("")
  const [aktifQr, setAktifQr] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const params = new URLSearchParams(window.location.search)
    const urlAracId = params.get("arac")

    supabase
      .from("araclar")
      .select("*")
      .eq("user_id", user.id)
      .neq("durum", "Pasif")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const userAraclar = (data as Arac[]) || []
        setAraclar(userAraclar)

        // Aktif QR'ı ayarla
        if (urlAracId && userAraclar.some((a) => a.id === urlAracId)) {
          setAktifQr(urlAracId)
        } else if (userAraclar.length > 0) {
          setAktifQr(userAraclar[0].id)
        }
        setYukleniyor(false)
      })
  }, [user])

  const filtrelenmis = araclar.filter(
    (a) => aramaMetni === "" || `${a.marka} ${a.model} ${a.versiyon}`.toLowerCase().includes(aramaMetni.toLowerCase())
  )

  const secilenArac = aktifQr ? araclar.find((a) => a.id === aktifQr) : null

  return (
    <div className="flex flex-col min-h-screen bg-af-bg">
      <PanelTopbar baslik="QR Kodlar" aciklama="Her araç için benzersiz QR kodu" />
      <main className="flex-1 p-6">

        {/* Yükleniyor durum */}
        {yukleniyor && (
          <div className="flex justify-center items-center py-20">
            <span className="w-10 h-10 border-4 border-af-accent/30 border-t-af-accent rounded-full animate-spin" />
          </div>
        )}

        {/* Boş durum — araç yok */}
        {!yukleniyor && araclar.length === 0 && (
          <div className="bg-af-surface border border-af-border rounded-2xl p-16 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-af-accent/10 border border-af-accent/20 flex items-center justify-center mb-5">
              <QrCode className="w-10 h-10 text-af-accent" />
            </div>
            <h2 className="text-xl font-black text-af-text mb-2">Henüz araç eklenmedi</h2>
            <p className="text-af-text-secondary text-sm max-w-sm mb-6">
              Araç eklediğinizde her bir araç için otomatik olarak üretilen QR kodları burada listelenecektir.
            </p>
            <Link
              href="/panel/araclar/yeni"
              className="flex items-center gap-2 bg-af-accent hover:bg-af-accent-hover text-white font-bold px-6 py-3 rounded-xl transition-all hover:shadow-xl hover:shadow-af-accent/25"
            >
              <Plus className="w-5 h-5" /> İlk Aracı Ekle
            </Link>
          </div>
        )}

        {!yukleniyor && araclar.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* SOL — Araç Listesi */}
            <div className="flex-1 min-w-0">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  type="text"
                  placeholder="Araç ara..."
                  value={aramaMetni}
                  onChange={(e) => setAramaMetni(e.target.value)}
                  className="w-full bg-af-surface border border-af-border text-af-text placeholder:text-af-text-disabled rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-af-accent transition-colors"
                />
              </div>

              {filtrelenmis.length === 0 ? (
                <div className="p-8 text-center text-af-text-disabled text-sm">
                  Arama kriterine uygun araç bulunamadı.
                </div>
              ) : (
                <div className="space-y-2">
                  {filtrelenmis.map((arac) => {
                    const isActive = aktifQr === arac.id
                    return (
                      <div key={arac.id}>
                        <button
                          onClick={() => setAktifQr(isActive ? null : arac.id)}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                            isActive ? "bg-af-accent/10 border-af-accent/40" : "bg-af-surface border-af-border hover:border-af-accent/20"
                          )}
                        >
                          <div className="w-16 h-12 rounded-xl overflow-hidden bg-af-surface-2 flex-shrink-0 flex items-center justify-center">
                            {arac.fotograflar?.[0] ? (
                              <img src={arac.fotograflar[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Car className="w-5 h-5 text-af-text-disabled" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("font-bold text-sm", isActive ? "text-af-accent" : "text-af-text")}>
                              {arac.marka} {arac.model}
                            </p>
                            <p className="text-af-text-disabled text-xs mt-0.5">
                              {arac.versiyon} · {formatKm(arac.km)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <DurumRozeti durum={arac.durum} size="sm" />
                            <code className="text-xs text-af-text-disabled font-mono">{arac.qr_slug}</code>
                          </div>
                        </button>

                        {/* Mobil genişletilmiş QR */}
                        {isActive && (
                          <div className="mt-2 lg:hidden bg-af-surface border border-af-accent/20 rounded-2xl p-5 flex flex-col items-center gap-4 animate-fadeIn">
                            <QrDisplay
                              aracSlug={arac.qr_slug}
                              aracAdi={`${arac.yil} ${arac.marka} ${arac.model}`}
                              size={180}
                              showDownload
                              showActions
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* SAĞ — QR Panel (desktop) */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="sticky top-20">
                {secilenArac ? (
                  <div className="bg-af-surface rounded-2xl border border-af-border p-6 shadow-xl">
                    <h3 className="font-bold text-af-text mb-0.5">{secilenArac.marka} {secilenArac.model}</h3>
                    <p className="text-af-text-secondary text-sm mb-5 truncate">{secilenArac.versiyon}</p>
                    
                    <div className="bg-white rounded-2xl p-4 flex justify-center mb-5 shadow-inner">
                      <QrDisplay
                        aracSlug={secilenArac.qr_slug}
                        aracAdi={`${secilenArac.yil} ${secilenArac.marka} ${secilenArac.model}`}
                        size={180}
                      />
                    </div>

                    <div className="bg-af-surface-2 rounded-xl p-3 mb-4 border border-af-border">
                      <p className="text-af-text-disabled text-xs mb-1">Müşteri URL Yolu</p>
                      <code className="text-af-accent text-xs break-all">/arac/{secilenArac.qr_slug}</code>
                    </div>

                    <QrDisplay
                      aracSlug={secilenArac.qr_slug}
                      aracAdi={`${secilenArac.yil} ${secilenArac.marka} ${secilenArac.model}`}
                      size={200}
                      showDownload
                      showActions
                    />

                    <div className="mt-4 p-3 bg-af-accent/5 border border-af-accent/15 rounded-xl">
                      <p className="text-af-accent text-[11px] leading-relaxed">
                        💡 Aracın camına yapıştırmak üzere A5 baskı için 500x500 boyutunda indirme seçeneğini kullanabilirsiniz.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-af-surface rounded-2xl border border-af-border p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-af-surface-2 border border-af-border flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-8 h-8 text-af-text-disabled" />
                    </div>
                    <p className="text-af-text-secondary text-sm">Bir araç seçerek QR kodunu detaylı görüntüleyin</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
