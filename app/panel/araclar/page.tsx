"use client"

import { useEffect, useState } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import { DurumRozeti } from "@/components/autoflow/durum-rozeti"
import { formatFiyat, formatKm } from "@/lib/arac-helpers"
import { AracDurum } from "@/lib/types"
import type { Arac } from "@/lib/types"
import { Search, Grid3x3, List, Edit2, Trash2, QrCode, Eye, Plus, Car } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

type ViewMode = "tablo" | "kart"
type FilterDurum = "Tümü" | AracDurum

export default function AraclarPage() {
  const { user } = useAuth()
  const supabase = createClient()

  const [araclar, setAraclar] = useState<Arac[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("tablo")
  const [aramaMetni, setAramaMetni] = useState("")
  const [durumFilter, setDurumFilter] = useState<FilterDurum>("Tümü")

  useEffect(() => {
    if (!user) return
    supabase
      .from("araclar")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setAraclar((data as Arac[]) || [])
        setYukleniyor(false)
      })
  }, [user])

  const filtrelenmis = araclar.filter((a) => {
    const aramaUyumu = aramaMetni === "" || `${a.marka} ${a.model} ${a.versiyon}`.toLowerCase().includes(aramaMetni.toLowerCase())
    const durumUyumu = durumFilter === "Tümü" || a.durum === durumFilter
    return aramaUyumu && durumUyumu
  })

  const durumSayilari = {
    Tümü: araclar.length,
    Aktif: araclar.filter((a) => a.durum === "Aktif").length,
    Satildi: araclar.filter((a) => a.durum === "Satildi").length,
    Pasif: araclar.filter((a) => a.durum === "Pasif").length,
  }

  return (
    <div className="flex flex-col min-h-screen bg-af-bg">
      <PanelTopbar baslik="Araçlarım" aciklama={yukleniyor ? "Yükleniyor..." : `${araclar.length} araç listeleniyor`} />

      <main className="flex-1 p-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
            <input
              type="text"
              placeholder="Araç ara (marka, model...)"
              value={aramaMetni}
              onChange={(e) => setAramaMetni(e.target.value)}
              className="w-full bg-af-surface border border-af-border text-af-text placeholder:text-af-text-disabled rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-af-accent transition-colors"
            />
          </div>
          <div className="flex gap-1 bg-af-surface border border-af-border rounded-xl p-1">
            {(["Tümü", "Aktif", "Satildi", "Pasif"] as FilterDurum[]).map((d) => (
              <button
                key={d}
                onClick={() => setDurumFilter(d)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  durumFilter === d ? "bg-af-accent text-white" : "text-af-text-secondary hover:text-af-text"
                )}
              >
                {d === "Satildi" ? "Satıldı" : d} <span className="opacity-60">({durumSayilari[d]})</span>
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-af-surface border border-af-border rounded-xl p-1">
            <button onClick={() => setViewMode("tablo")} className={cn("p-2 rounded-lg transition-colors", viewMode === "tablo" ? "bg-af-accent text-white" : "text-af-text-disabled")}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("kart")} className={cn("p-2 rounded-lg transition-colors", viewMode === "kart" ? "bg-af-accent text-white" : "text-af-text-disabled")}>
              <Grid3x3 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Yükleniyor skeleton */}
        {yukleniyor && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-af-surface rounded-xl border border-af-border animate-pulse" />
            ))}
          </div>
        )}

        {/* Boş durum — hiç araç yok */}
        {!yukleniyor && araclar.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-af-surface border border-af-border flex items-center justify-center mb-5">
              <Car className="w-10 h-10 text-af-text-disabled" />
            </div>
            <h2 className="text-xl font-black text-af-text mb-2">Henüz araç eklemediniz</h2>
            <p className="text-af-text-secondary text-sm mb-6 max-w-xs">
              İlk aracınızı ekleyin, QR kodunu yazdırın ve müşterileriniz tüm detaylara anında ulaşsın.
            </p>
            <Link
              href="/panel/araclar/yeni"
              className="flex items-center gap-2 bg-af-accent hover:bg-af-accent-hover text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-xl hover:shadow-af-accent/25"
            >
              <Plus className="w-4 h-4" /> İlk Aracı Ekle
            </Link>
          </div>
        )}

        {/* Filtreye uyan araç yok ama liste boş değil */}
        {!yukleniyor && araclar.length > 0 && filtrelenmis.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-af-surface border border-af-border flex items-center justify-center mb-4">
              <Car className="w-8 h-8 text-af-text-disabled" />
            </div>
            <p className="text-af-text-secondary font-medium">Filtreye uyan araç bulunamadı</p>
          </div>
        )}

        {/* TABLO */}
        {!yukleniyor && viewMode === "tablo" && filtrelenmis.length > 0 && (
          <div className="bg-af-surface rounded-2xl border border-af-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-af-border">
                  <th className="text-left text-xs font-semibold text-af-text-disabled uppercase tracking-wider px-5 py-3.5">Araç</th>
                  <th className="text-left text-xs font-semibold text-af-text-disabled uppercase tracking-wider px-4 py-3.5 hidden md:table-cell">KM / Yakıt</th>
                  <th className="text-left text-xs font-semibold text-af-text-disabled uppercase tracking-wider px-4 py-3.5 hidden lg:table-cell">Fiyat</th>
                  <th className="text-left text-xs font-semibold text-af-text-disabled uppercase tracking-wider px-4 py-3.5">Durum</th>
                  <th className="text-right text-xs font-semibold text-af-text-disabled uppercase tracking-wider px-5 py-3.5">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-af-border/50">
                {filtrelenmis.map((arac) => (
                  <tr key={arac.id} className="hover:bg-af-surface-2 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-xl overflow-hidden bg-af-surface-2 flex-shrink-0 flex items-center justify-center">
                          {arac.fotograflar?.[0] ? (
                            <img src={arac.fotograflar[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Car className="w-5 h-5 text-af-text-disabled" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-af-text text-sm truncate">{arac.marka} {arac.model}</p>
                          <p className="text-af-text-disabled text-xs truncate">{arac.yil} · {arac.versiyon}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <p className="text-af-text-secondary text-sm">{formatKm(arac.km)}</p>
                      <p className="text-af-text-disabled text-xs">{arac.yakit} · {arac.vites}</p>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      {arac.fiyat_gizle ? (
                        <span className="text-af-text-disabled text-sm">—</span>
                      ) : arac.fiyat ? (
                        <span className="text-af-accent font-bold text-sm">{formatFiyat(arac.fiyat)}</span>
                      ) : <span className="text-af-text-disabled text-sm">—</span>}
                    </td>
                    <td className="px-4 py-4"><DurumRozeti durum={arac.durum} size="sm" /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/arac/${arac.qr_slug}`} target="_blank" className="p-1.5 rounded-lg text-af-text-disabled hover:text-af-accent hover:bg-af-accent/10 transition-colors" title="Müşteri sayfası">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/panel/qr?arac=${arac.id}`} className="p-1.5 rounded-lg text-af-text-disabled hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors" title="QR Kodu">
                          <QrCode className="w-4 h-4" />
                        </Link>
                        <Link href={`/panel/araclar/${arac.id}/duzenle`} className="p-1.5 rounded-lg text-af-text-disabled hover:text-af-info hover:bg-af-info/10 transition-colors" title="Düzenle">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button className="p-1.5 rounded-lg text-af-text-disabled hover:text-af-error hover:bg-af-error/10 transition-colors" title="Sil">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* KART */}
        {!yukleniyor && viewMode === "kart" && filtrelenmis.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtrelenmis.map((arac) => (
              <div key={arac.id} className="bg-af-surface rounded-2xl border border-af-border overflow-hidden group hover:border-af-accent/30 transition-colors">
                <div className="relative" style={{ aspectRatio: "16/9" }}>
                  {arac.fotograflar?.[0] ? (
                    <img src={arac.fotograflar[0]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-af-surface-2 flex items-center justify-center">
                      <Car className="w-12 h-12 text-af-text-disabled" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3"><DurumRozeti durum={arac.durum} size="sm" /></div>
                  {arac.durum === "Satildi" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-black text-xl tracking-widest border-4 border-white px-3 py-1 rotate-[-8deg]">SATILDI</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-bold text-af-text">{arac.marka} {arac.model}</p>
                  <p className="text-af-text-disabled text-sm">{arac.yil} · {arac.versiyon}</p>
                  <div className="flex items-center justify-between mt-3">
                    {arac.fiyat_gizle ? (
                      <span className="text-af-text-disabled text-sm">Fiyat gizli</span>
                    ) : arac.fiyat ? (
                      <span className="text-af-accent font-black">{formatFiyat(arac.fiyat)}</span>
                    ) : null}
                    <div className="flex gap-1.5">
                      <Link href={`/arac/${arac.qr_slug}`} target="_blank" className="p-1.5 rounded-lg bg-af-surface-2 text-af-text-disabled hover:text-af-accent transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link href={`/panel/araclar/${arac.id}/duzenle`} className="p-1.5 rounded-lg bg-af-surface-2 text-af-text-disabled hover:text-af-info transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
