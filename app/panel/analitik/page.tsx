"use client"

import { useEffect, useState } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { Arac, QrEvent } from "@/lib/types"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { TrendingUp, Eye, MessageCircle, Smartphone, BarChart3 } from "lucide-react"

export default function AnalitikPage() {
  const { user } = useAuth()
  const supabase = createClient()

  const [araclar, setAraclar] = useState<Arac[]>([])
  const [events, setEvents] = useState<QrEvent[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)

  useEffect(() => {
    if (!user) return

    async function veriGetir() {
      if (!user) return
      try {
        // 1. Kullanıcının araçlarını getir
        const { data: araclarData, error: araclarError } = await supabase
          .from("araclar")
          .select("*")
          .eq("user_id", user.id)

        if (araclarError) throw araclarError
        const userAraclar = (araclarData as Arac[]) || []
        setAraclar(userAraclar)

        if (userAraclar.length === 0) {
          setEvents([])
          setYukleniyor(false)
          return
        }

        // 2. Bu araçlara ait QR olaylarını getir
        const aracIds = userAraclar.map((a) => a.id)
        const { data: eventsData, error: eventsError } = await supabase
          .from("qr_events")
          .select("*")
          .in("arac_id", aracIds)
          .order("timestamp", { ascending: true })

        if (eventsError) throw eventsError
        setEvents((eventsData as QrEvent[]) || [])
      } catch (err) {
        console.error("Analitik verisi yüklenirken hata oluştu:", err)
      } finally {
        setYukleniyor(false)
      }
    }

    veriGetir()
  }, [user])

  // --- HESAPLAMALAR ---
  const TOPLAM_QR = events.length
  const TOPLAM_WA = events.filter((e) => e.whatsapp_tiklamasi).length
  const DONUSUM = TOPLAM_QR > 0 ? Math.round((TOPLAM_WA / TOPLAM_QR) * 100) : 0
  const MOBILE_ORAN = TOPLAM_QR > 0 ? Math.round((events.filter((e) => e.device_type === "mobile").length / TOPLAM_QR) * 100) : 0

  const STAT_CARDS = [
    { label: "Toplam Okutma", value: TOPLAM_QR, icon: Eye, color: "text-af-accent", bg: "bg-af-accent/10 border-af-accent/20" },
    { label: "WhatsApp Tıklaması", value: TOPLAM_WA, icon: MessageCircle, color: "text-af-success", bg: "bg-af-success/10 border-af-success/20" },
    { label: "Dönüşüm Oranı", value: `%${DONUSUM}`, icon: TrendingUp, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10 border-[#D4AF37]/20" },
    { label: "Mobil Kullanım", value: `%${MOBILE_ORAN}`, icon: Smartphone, color: "text-af-info", bg: "bg-af-info/10 border-af-info/20" },
  ]

  // Son 7 Günlük Trend Data
  const getSonYediGunData = () => {
    const gunler = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        gun: d.toLocaleDateString("tr-TR", { weekday: "short" }),
        tarih: d.toDateString(),
        okutma: 0,
        whatsapp: 0,
      }
    })

    events.forEach((ev) => {
      const idx = gunler.findIndex((g) => g.tarih === new Date(ev.timestamp).toDateString())
      if (idx !== -1) {
        gunler[idx].okutma++
        if (ev.whatsapp_tiklamasi) gunler[idx].whatsapp++
      }
    })
    return gunler
  }

  // Araç Bazlı Okutma Data
  const getAracOkutmaData = () => {
    const sayilar = events.reduce<Record<string, number>>((acc, ev) => {
      acc[ev.arac_id] = (acc[ev.arac_id] || 0) + 1
      return acc
    }, {})

    return araclar
      .map((a) => ({ ad: `${a.marka} ${a.model}`, okutma: sayilar[a.id] || 0 }))
      .sort((a, b) => b.okutma - a.okutma)
      .slice(0, 6)
  }

  // Cihaz Dağılımı Data
  const getCihazData = () => {
    const s = { mobile: 0, tablet: 0, desktop: 0 }
    events.forEach((ev) => {
      if (s[ev.device_type] !== undefined) {
        s[ev.device_type]++
      } else {
        s.mobile++ // Fallback
      }
    })
    return [
      { name: "Mobil 📱", value: s.mobile, color: "#FF7A00" },
      { name: "Tablet 📋", value: s.tablet, color: "#D4AF37" },
      { name: "Masaüstü 💻", value: s.desktop, color: "#22C55E" },
    ]
  }

  const haftalikData = getSonYediGunData()
  const aracData = getAracOkutmaData()
  const cihazData = getCihazData()

  const tooltipStyle = { background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, color: "#FFFFFF" }
  const labelStyle = { color: "#BDBDBD" }

  return (
    <div className="flex flex-col min-h-screen bg-af-bg">
      <PanelTopbar baslik="Analitik" aciklama="Son 7 günlük performans" />
      <main className="flex-1 p-6 space-y-6">

        {/* Yükleniyor skeleton */}
        {yukleniyor && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-af-surface border border-af-border rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="h-80 bg-af-surface border border-af-border rounded-2xl animate-pulse" />
          </div>
        )}

        {/* Veri Yok Ekranı */}
        {!yukleniyor && TOPLAM_QR === 0 && (
          <div className="bg-af-surface border border-af-border rounded-2xl p-16 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-af-accent/10 border border-af-accent/20 flex items-center justify-center mb-5">
              <BarChart3 className="w-10 h-10 text-af-accent" />
            </div>
            <h2 className="text-xl font-black text-af-text mb-2">Henüz analiz verisi toplanmadı</h2>
            <p className="text-af-text-secondary text-sm max-w-sm">
              Araçlarınızın QR kodları müşterileriniz tarafından okutulduğunda ve WhatsApp üzerinden sizinle iletişime geçildiğinde burada canlı grafikler belirecektir.
            </p>
          </div>
        )}

        {/* Gerçek Veri Varsa Grafikleri Göster */}
        {!yukleniyor && TOPLAM_QR > 0 && (
          <>
            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {STAT_CARDS.map((card) => (
                <div key={card.label} className={`bg-af-surface rounded-2xl border p-5 ${card.bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-af-text-secondary text-sm">{card.label}</span>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <p className={`text-3xl font-black ${card.color}`}>{card.value}</p>
                  <p className="text-af-text-disabled text-xs mt-1">Tüm zamanlar</p>
                </div>
              ))}
            </div>

            {/* Haftalık Trend */}
            <div className="bg-af-surface rounded-2xl border border-af-border p-5">
              <h2 className="font-bold text-af-text mb-5">QR Okutma Trendi — Son 7 Gün</h2>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={haftalikData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="grad-okutma" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FF7A00" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="grad-wa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                  <XAxis dataKey="gun" tick={{ fill: "#8A8A8A", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8A8A8A", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={labelStyle} />
                  <Area type="monotone" dataKey="okutma" name="QR Okutma" stroke="#FF7A00" fill="url(#grad-okutma)" strokeWidth={2} dot={{ fill: "#FF7A00", r: 4 }} />
                  <Area type="monotone" dataKey="whatsapp" name="WhatsApp" stroke="#22c55e" fill="url(#grad-wa)" strokeWidth={2} dot={{ fill: "#22c55e", r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Araç Bazlı Bar */}
              <div className="lg:col-span-2 bg-af-surface rounded-2xl border border-af-border p-5">
                <h2 className="font-bold text-af-text mb-5">Araç Bazlı QR Okutma</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={aracData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                    <XAxis dataKey="ad" tick={{ fill: "#8A8A8A", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" />
                    <YAxis tick={{ fill: "#8A8A8A", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="okutma" name="Okutma" fill="#FF7A00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Cihaz Pie */}
              <div className="bg-af-surface rounded-2xl border border-af-border p-5">
                <h2 className="font-bold text-af-text mb-5">Cihaz Dağılımı</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={cihazData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                      {cihazData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {cihazData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-af-text-secondary">{d.name}</span>
                      </div>
                      <span className="text-af-text font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
