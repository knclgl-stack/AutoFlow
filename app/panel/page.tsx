"use client"

import { useEffect, useState } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import { FourStepFlow } from "@/components/autoflow/four-step-flow"
import { formatKm } from "@/lib/arac-helpers"
import { DurumRozeti } from "@/components/autoflow/durum-rozeti"
import { Car, QrCode, TrendingUp, MessageCircle, ArrowUpRight, Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { Arac } from "@/lib/types"

export default function PanelDashboard() {
  const { user } = useAuth()
  const supabase = createClient()

  const [araclar, setAraclar] = useState<Arac[]>([])
  const [qrOkutmalari, setQrOkutmalari] = useState<number>(0)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [galeriSlug, setGaleriSlug] = useState("galerim")

  useEffect(() => {
    if (!user) return
    const userId = user.id

    async function fetchDashboardData() {
      try {
        // Galeri slug'ını getir
        const { data: profile } = await supabase
          .from("galeri_profilleri")
          .select("slug")
          .eq("user_id", userId)
          .maybeSingle()

        if (profile && profile.slug) {
          setGaleriSlug(profile.slug)
        } else {
          // Profil yoksa (SQL göçünden önce açılan yarım hesap) otomatik oluştur (self-healing)
          if (!user) return
          const tempGaleriAdi = user.user_metadata?.galeri_adi || "Galerim"
          let slug = `galeri-${Math.random().toString(36).substring(2, 8)}`
          
          // Çakışma kontrolü
          const { data: checkData } = await supabase
            .from("galeri_profilleri")
            .select("user_id")
            .eq("slug", slug)

          if (checkData && checkData.length > 0) {
            slug = `galeri-${Math.random().toString(36).substring(2, 8)}`
          }

          const { error: insertErr } = await supabase
            .from("galeri_profilleri")
            .insert({
              user_id: userId,
              galeri_adi: tempGaleriAdi,
              slug: slug,
              plan: "Essential",
              adres: "Adres belirtilmemiş",
              telefon: "Telefon belirtilmemiş",
              calisma_saatleri: { hafta_ici: "09:00 - 19:00", hafta_sonu: "10:00 - 18:00" }
            })

          if (!insertErr) {
            setGaleriSlug(slug)
          }
        }
        const { data: araclarData, error: araclarError } = await supabase
          .from("araclar")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })

        if (araclarError) throw araclarError
        const userAraclar = (araclarData as Arac[]) || []
        setAraclar(userAraclar)

        if (userAraclar.length > 0) {
          const aracIds = userAraclar.map((a) => a.id)

          // Bu haftanın Pazartesi gece yarısından itibaren say (TR saati UTC+3)
          const bugunPzt = new Date()
          const gun = bugunPzt.getDay() // 0=Pazar, 1=Pzt, ..., 6=Cmt
          const fark = gun === 0 ? 6 : gun - 1 // Pazartesi'ye kaç gün geriye git
          bugunPzt.setDate(bugunPzt.getDate() - fark)
          bugunPzt.setHours(0, 0, 0, 0)

          const { count, error: eventsError } = await supabase
            .from("qr_events")
            .select("*", { count: "exact", head: true })
            .in("arac_id", aracIds)
            .gte("timestamp", bugunPzt.toISOString())

          if (eventsError) throw eventsError
          if (count !== null) {
            setQrOkutmalari(count)
          }
        }
      } catch (err) {
        console.error("Dashboard veri hatası:", err)
      } finally {
        setYukleniyor(false)
      }
    }

    fetchDashboardData()
  }, [user])

  const toplamArac = araclar.length
  const aktifArac = araclar.filter((a) => a.durum === "Aktif").length
  const satilanArac = araclar.filter((a) => a.durum === "Satildi").length
  const sonEklenen = araclar.slice(0, 4)

  const statCards = [
    { label: "Toplam Araç", value: toplamArac, icon: Car, gradient: "from-af-accent to-af-accent-active" },
    { label: "Aktif Araç", value: aktifArac, icon: TrendingUp, gradient: "from-af-success to-[#16a34a]" },
    { label: "Satılan Araç", value: satilanArac, icon: QrCode, gradient: "from-[#D4AF37] to-[#b8962f]" },
    { label: "Bu Hafta QR", value: qrOkutmalari, icon: MessageCircle, gradient: "from-[#25D366] to-[#16a34a]" },
  ]

  const bosEkran = !yukleniyor && toplamArac === 0
  const profilHazir = galeriSlug !== "galerim"

  const baslangicAdimlari = [
    {
      title: "Galerini tamamla",
      description: "Telefon, adres ve vitrin bilgilerini kontrol et.",
      href: "/panel/ayarlar",
      actionLabel: "Profili düzenle",
      status: profilHazir ? "complete" : "current",
    },
    {
      title: "Aracını ekle",
      description: "Bilgileri dört kısa aşamada girip yayınla.",
      href: "/panel/araclar/yeni",
      actionLabel: toplamArac > 0 ? "Yeni araç ekle" : "İlk aracı ekle",
      status: toplamArac > 0 ? "complete" : profilHazir ? "current" : "upcoming",
    },
    {
      title: "QR kodunu indir",
      description: "Otomatik oluşan QR kartını araçta kullan.",
      href: "/panel/qr",
      actionLabel: "QR kodlara git",
      status: qrOkutmalari > 0 ? "complete" : toplamArac > 0 ? "current" : "upcoming",
    },
    {
      title: "İlgiyi takip et",
      description: "Görüntülenme ve müşteri hareketlerini izle.",
      href: "/panel/analitik",
      actionLabel: "Analitiği aç",
      status: qrOkutmalari > 0 ? "current" : "upcoming",
    },
  ] as const

  return (
    <div className="flex flex-col min-h-screen bg-af-bg">
      <PanelTopbar baslik="Dashboard" />
      <main className="flex-1 p-6 space-y-6">

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className={cn("relative overflow-hidden rounded-2xl p-5 shadow-xl bg-gradient-to-br", card.gradient)}>
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/70 text-sm font-medium">{card.label}</span>
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                    <card.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                {yukleniyor ? (
                  <div className="w-12 h-9 bg-white/20 rounded-lg animate-pulse" />
                ) : (
                  <p className="text-white text-4xl font-black">{card.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <FourStepFlow
          title="İlk müşteriye giden en kısa yol"
          description="AutoFlow'da temel kurulumdan ölçülebilir müşteri ilgisine dört adımda ulaşın."
          steps={baslangicAdimlari}
        />

        {/* BOŞ EKRAN — yeni kullanıcı */}
        {bosEkran && (
          <div className="bg-af-surface border border-af-border rounded-2xl p-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-af-accent/10 border border-af-accent/20 flex items-center justify-center mb-5">
              <Car className="w-10 h-10 text-af-accent" />
            </div>
            <h2 className="text-xl font-black text-af-text mb-2">Henüz araç eklenmedi</h2>
            <p className="text-af-text-secondary text-sm max-w-sm mb-6">
              İlk aracınızı ekleyin, QR kodunu yazdırın ve müşterileriniz tüm detaylara anında ulaşsın.
            </p>
            <div className="w-full max-w-xs mx-auto">
              <Link
                href="/panel/araclar/yeni"
                className="flex items-center justify-center gap-2 bg-af-accent hover:bg-af-accent-hover text-white font-bold px-6 py-3 rounded-xl transition-all hover:shadow-xl hover:shadow-af-accent/25 text-sm"
              >
                <Plus className="w-5 h-5" /> İlk Aracı Ekle
              </Link>
            </div>
          </div>
        )}

        {/* SON EKLENEN ARAÇLAR — veri varsa */}
        {!bosEkran && (
          <div className="bg-af-surface rounded-2xl border border-af-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-af-text">Son Eklenen Araçlar</h2>
              <Link href="/panel/araclar" className="text-xs text-af-accent hover:text-af-accent-hover flex items-center gap-1 transition-colors">
                Tümünü gör <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            {yukleniyor ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-af-surface-2 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {sonEklenen.map((arac, idx) => (
                  <Link
                    key={arac.id}
                    href={`/panel/araclar/${arac.id}/duzenle`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-af-surface-2 hover:bg-af-border transition-colors"
                  >
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                      idx === 0 ? "bg-[#D4AF37] text-white" : idx === 1 ? "bg-af-text-secondary text-af-bg" :
                      idx === 2 ? "bg-[#CD7F32] text-white" : "bg-af-border text-af-text-disabled"
                    )}>{idx + 1}</span>
                    {arac.fotograflar?.[0] ? (
                      <div className="w-12 h-9 rounded-lg overflow-hidden bg-af-border flex-shrink-0">
                        <img src={arac.fotograflar[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-9 rounded-lg bg-af-border flex items-center justify-center flex-shrink-0">
                        <Car className="w-4 h-4 text-af-text-disabled" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-af-text text-sm font-semibold truncate">{arac.marka} {arac.model}</p>
                      <p className="text-af-text-disabled text-xs truncate">{arac.versiyon} · {formatKm(arac.km)}</p>
                    </div>
                    <DurumRozeti durum={arac.durum} size="sm" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HIZLI AKSIYONLAR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/panel/araclar/yeni", icon: "➕", label: "Yeni Araç Ekle", color: "bg-af-accent/10 border-af-accent/20 text-af-accent" },
            { href: "/panel/qr", icon: "📱", label: "QR Kodları Gör", color: "bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37]" },
            { href: "/panel/analitik", icon: "📊", label: "Analitikleri İncele", color: "bg-af-success/10 border-af-success/20 text-af-success" },
            { href: `/galeri/${galeriSlug}`, icon: "🏪", label: "Galeri Sayfam", color: "bg-af-info/10 border-af-info/20 text-af-info" },
          ].map((action) => (
            <Link key={action.href} href={action.href} className={cn("flex items-center gap-3 p-4 rounded-2xl border transition-all hover:scale-[1.02]", action.color)}>
              <span className="text-2xl">{action.icon}</span>
              <span className="font-semibold text-sm">{action.label}</span>
            </Link>
          ))}
        </div>

      </main>
    </div>
  )
}
