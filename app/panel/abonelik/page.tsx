"use client"

import { useState, useEffect } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import {
  Check, Zap, Crown, Star, ChevronRight, CreditCard,
  Car, Receipt, Shield, Sparkles, X, AlertCircle, Landmark, Clock3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import type { PlanTalebi } from "@/lib/types"
import { getVehicleLimit, normalizePlan } from "@/lib/plans"

const HAVALE_ALICI = process.env.NEXT_PUBLIC_HAVALE_ALICI || "Alıcı tanımlanmadı"
const HAVALE_IBAN = process.env.NEXT_PUBLIC_HAVALE_IBAN || "IBAN tanımlanmadı"
const HAVALE_HAZIR = Boolean(
  process.env.NEXT_PUBLIC_HAVALE_ALICI && process.env.NEXT_PUBLIC_HAVALE_IBAN
)

/* ─────────────────────────────────────────────
   PLAN TANIMLARI
   ───────────────────────────────────────────── */
const PLANLAR = [
  {
    id: "essentials",
    ad: "Essentials",
    fiyatAylik: 0,
    fiyatYillik: 0,
    fiyatStr: "Ücretsiz",
    altBaslik: "Küçük galeriler için başlangıç paketi",
    renk: "border-af-border",
    renkVurgu: "text-af-text-secondary",
    bgCard: "bg-af-surface",
    icon: Car,
    iconColor: "text-af-text-secondary",
    iconBg: "bg-af-surface-2",
    badge: null,
    ozellikler: [
      { text: "3 araç ilanı", aktif: true },
      { text: "Temel galeri profili sayfası", aktif: true },
      { text: "QR kod oluşturma", aktif: true },
      { text: "AutoFlow markası görünür", aktif: true },
      { text: "Flow AI Akıllı Stüdyo", aktif: false },
      { text: "Gelişmiş analitik", aktif: false },
      { text: "Özel alan adı (slug)", aktif: false },
      { text: "Öncelikli destek", aktif: false },
      { text: "E-posta destek", aktif: true },
    ]
  },
  {
    id: "professional",
    ad: "Professional",
    fiyatAylik: 2990,
    fiyatYillik: 1990,
    fiyatStr: "₺2.990",
    altBaslik: "Büyüyen galeriler için güçlü araçlar",
    renk: "border-af-accent/50",
    renkVurgu: "text-af-accent",
    bgCard: "bg-af-surface",
    icon: Star,
    iconColor: "text-af-accent",
    iconBg: "bg-af-accent/10",
    badge: "En Popüler",
    ozellikler: [
      { text: "30 araç ilanı", aktif: true },
      { text: "Profesyonel galeri profili sayfası", aktif: true },
      { text: "QR kod oluşturma", aktif: true },
      { text: "AutoFlow markası kaldırılır", aktif: true },
      { text: "Flow AI Stüdyo (ayda 150 işlem)", aktif: true },
      { text: "Gelişmiş analitik ve raporlar", aktif: true },
      { text: "Özel alan adı (slug) seçimi", aktif: true },
      { text: "Öncelikli destek", aktif: false },
      { text: "Havale ile güvenli plan yükseltme", aktif: true },
    ]
  },
  {
    id: "elite",
    ad: "Elite",
    fiyatAylik: 4990,
    fiyatYillik: 2990,
    fiyatStr: "₺4.990",
    altBaslik: "Büyük galeriler ve kurumsal yapılar için",
    renk: "border-amber-500/40",
    renkVurgu: "text-amber-400",
    bgCard: "bg-gradient-to-b from-amber-950/20 to-af-surface",
    icon: Crown,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/10",
    badge: "Elit",
    ozellikler: [
      { text: "Sınırsız araç ilanı", aktif: true },
      { text: "Premium galeri profili sayfası", aktif: true },
      { text: "QR kod oluşturma", aktif: true },
      { text: "AutoFlow markası kaldırılır", aktif: true },
      { text: "Flow AI Stüdyo (ayda 500 işlem)", aktif: true },
      { text: "Gelişmiş analitik ve raporlar", aktif: true },
      { text: "Özel alan adı (slug) seçimi", aktif: true },
      { text: "7/24 öncelikli destek", aktif: true },
      { text: "Havale ile güvenli plan yükseltme", aktif: true },
    ]
  }
]

export default function AbonelikPage() {
  const { user } = useAuth()
  const supabase = createClient()

  const [aktifPlan, setAktifPlan] = useState("essentials")
  const [aracSayisi, setAracSayisi] = useState(0)
  const [odemePeriyodu, setOdemePeriyodu] = useState<"aylik" | "yillik">("aylik")
  const [seciliPlan, setSeciliPlan] = useState<string | null>(null)
  const [onayModal, setOnayModal] = useState(false)
  const [basariModal, setBasariModal] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [bekleyenTalep, setBekleyenTalep] = useState<PlanTalebi | null>(null)
  const [havaleReferansi, setHavaleReferansi] = useState("")
  const [kullaniciNotu, setKullaniciNotu] = useState("")
  const [hata, setHata] = useState("")

  useEffect(() => {
    if (!user) return
    async function abonelikYukle() {
      if (!user) return
      // 1. Galeri Planını Getir
      const { data: profile } = await supabase
        .from("galeri_profilleri")
        .select("plan")
        .eq("user_id", user.id)
        .single()

      if (profile && profile.plan) {
        const dbPlan = profile.plan.toLowerCase()
        const mappedPlan = dbPlan === "essential" ? "essentials" : dbPlan
        setAktifPlan(mappedPlan)
      }

      // 2. Ekli araç sayısını getir
      const { count } = await supabase
        .from("araclar")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)

      if (count !== null) {
        setAracSayisi(count)
      }

      const { data: pendingRequest } = await supabase
        .from("plan_talepleri")
        .select("*")
        .eq("user_id", user.id)
        .eq("durum", "bekliyor")
        .maybeSingle()

      setBekleyenTalep((pendingRequest as PlanTalebi | null) || null)
    }
    abonelikYukle()
  }, [user])

  const maxArac = getVehicleLimit(aktifPlan) ?? 999999
  const secilenPlanBilgi = PLANLAR.find(p => p.id === seciliPlan)

  function planSec(planId: string) {
    if (planId === aktifPlan) return
    if (bekleyenTalep) {
      setHata("Önce mevcut havale talebinizin değerlendirilmesini bekleyin.")
      return
    }
    if (planId === "essentials") {
      setHata("Ücretsiz plana dönüş talepleri için destek ekibiyle iletişime geçin.")
      return
    }
    if (!HAVALE_HAZIR) {
      setHata("Havale bilgileri henüz yapılandırılmadı. Lütfen destek ekibiyle iletişime geçin.")
      return
    }
    setHata("")
    setSeciliPlan(planId)
    setOnayModal(true)
  }

  async function planOnay() {
    if (!seciliPlan || !user) return
    setYukleniyor(true)

    const mappedPlan = seciliPlan === "professional" ? "Professional" : "Elite"

    if (havaleReferansi.trim().length < 3) {
      setHata("Lütfen banka işlem/dekont referansını girin.")
      setYukleniyor(false)
      return
    }

    try {
      const { data: requestId, error } = await supabase.rpc("create_plan_request", {
        p_plan: mappedPlan,
        p_period: odemePeriyodu,
        p_reference: havaleReferansi.trim(),
        p_note: kullaniciNotu.trim() || null,
      })

      if (error) throw error

      setBekleyenTalep({
        id: requestId as string,
        user_id: user.id,
        mevcut_plan: normalizePlan(aktifPlan),
        talep_edilen_plan: mappedPlan,
        odeme_periyodu: odemePeriyodu,
        tutar: odemePeriyodu === "yillik" ? (secilenPlanBilgi?.fiyatYillik || 0) * 12 : secilenPlanBilgi?.fiyatAylik || 0,
        havale_referansi: havaleReferansi.trim(),
        kullanici_notu: kullaniciNotu.trim() || null,
        durum: "bekliyor",
        created_at: new Date().toISOString(),
      })
      setBasariModal(true)
      setOnayModal(false)
      setSeciliPlan(null)
      setHavaleReferansi("")
      setKullaniciNotu("")
    } catch (err: any) {
      console.error("Plan güncellenirken hata:", err)
      setHata(err.message || "Havale talebi oluşturulamadı. Lütfen tekrar deneyin.")
    } finally {
      setYukleniyor(false)
    }
  }

  function getFiyat(plan: typeof PLANLAR[0]) {
    if (plan.fiyatAylik === 0) return "Ücretsiz"
    const fiyat = odemePeriyodu === "yillik" ? (plan.fiyatYillik * 12) : plan.fiyatAylik
    return `₺${fiyat.toLocaleString("tr-TR")}`
  }

  return (
    <div className="flex flex-col min-h-screen bg-af-bg text-af-text">
      <PanelTopbar baslik="Abonelik Yönetimi" aciklama="Paketinizi yönetin ve yükseltin" />

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full pb-16 space-y-8">

        {hata && (
          <div className="flex items-start gap-3 rounded-2xl border border-af-error/30 bg-af-error/10 px-4 py-3 text-sm text-af-error">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{hata}</p>
          </div>
        )}

        {bekleyenTalep && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <p className="font-bold text-white">Havale talebiniz inceleniyor</p>
                <p className="mt-1 text-xs text-af-text-secondary">
                  {bekleyenTalep.talep_edilen_plan} · {bekleyenTalep.odeme_periyodu === "yillik" ? "Yıllık" : "Aylık"} · Referans: {bekleyenTalep.havale_referansi}
                </p>
              </div>
            </div>
            <span className="w-fit rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">Onay bekliyor</span>
          </div>
        )}

        {/* ── Mevcut Abonelik Özeti ── */}
        <div className="bg-af-surface border border-af-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-af-accent/10 border border-af-accent/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-af-accent" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-af-text-disabled mb-0.5">Aktif Planınız</p>
              <h3 className="font-black text-white text-base flex items-center gap-2">
                {PLANLAR.find(p => p.id === aktifPlan)?.ad}
                <span className="text-[10px] bg-af-success/10 text-af-success border border-af-success/20 px-2 py-0.5 rounded-full font-bold">Aktif</span>
              </h3>
              <p className="text-xs text-af-text-disabled mt-0.5">Kullanım Durumu: Aktif</p>
            </div>
          </div>

          <div className="flex items-center gap-6 sm:text-right">
            <div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-af-text-disabled mb-0.5">Araç Kullanımı</p>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-af-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-af-accent rounded-full transition-all"
                    style={{ width: `${maxArac === 999999 ? 100 : (aracSayisi / maxArac) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-white">{aracSayisi}/{maxArac === 999999 ? "∞" : maxArac}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Ödeme Periyodu Toggle ── */}
        <div className="flex flex-col items-center gap-3">
          <h2 className="text-xl font-black text-white text-center">Paket Seçin</h2>
          <p className="text-sm text-af-text-secondary text-center max-w-md">
            İhtiyacınıza göre aylık veya yıllık plan seçin. Yıllık ödemelerde <span className="text-af-success font-bold">%40'a kadar tasarruf</span> edin.
          </p>

          <div className="flex items-center bg-af-surface border border-af-border rounded-2xl p-1 gap-1 mt-1">
            <button
              onClick={() => setOdemePeriyodu("aylik")}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-bold transition-all",
                odemePeriyodu === "aylik"
                  ? "bg-af-accent text-white shadow-lg shadow-af-accent/20"
                  : "text-af-text-secondary hover:text-white"
              )}
            >
              Aylık
            </button>
            <button
              onClick={() => setOdemePeriyodu("yillik")}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                odemePeriyodu === "yillik"
                  ? "bg-af-accent text-white shadow-lg shadow-af-accent/20"
                  : "text-af-text-secondary hover:text-white"
              )}
            >
              Yıllık
              <span className="text-[10px] bg-af-success/20 text-af-success px-1.5 py-0.5 rounded-md font-black">Yıllık avantaj</span>
            </button>
          </div>
        </div>

        {/* ── Plan Kartları ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANLAR.map((plan) => {
            const Icon = plan.icon
            const aktif = aktifPlan === plan.id

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-2xl border-2 p-6 flex flex-col transition-all duration-300",
                  plan.bgCard,
                  plan.renk,
                  aktif ? "ring-2 ring-af-accent/30" : "hover:border-opacity-80"
                )}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={cn(
                    "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                    plan.id === "professional"
                      ? "bg-af-accent text-white border-af-accent"
                      : "bg-amber-500 text-black border-amber-400"
                  )}>
                    {plan.badge === "En Popüler" ? <><Star className="w-2.5 h-2.5 inline mb-0.5 mr-1" />{plan.badge}</> : <><Crown className="w-2.5 h-2.5 inline mb-0.5 mr-1" />{plan.badge}</>}
                  </div>
                )}

                {/* Mevcut plan işareti */}
                {aktif && (
                  <div className="absolute top-3 right-3 text-[10px] bg-af-success/10 text-af-success border border-af-success/20 px-2 py-0.5 rounded-full font-bold">
                    ✓ Mevcut Planınız
                  </div>
                )}

                {/* Icon + Başlık */}
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", plan.iconBg)}>
                  <Icon className={cn("w-6 h-6", plan.iconColor)} />
                </div>

                <h3 className="font-black text-white text-lg">{plan.ad}</h3>
                <p className="text-xs text-af-text-disabled mt-1 mb-4 leading-relaxed">{plan.altBaslik}</p>

                {/* Fiyat */}
                <div className="mb-5">
                  <div className="flex items-end gap-1">
                    <span className={cn("text-3xl font-black", plan.renkVurgu)}>
                      {getFiyat(plan)}
                    </span>
                    {plan.fiyatAylik > 0 && (
                      <span className="text-af-text-disabled text-sm mb-1">
                        {odemePeriyodu === "yillik" ? "/ yıl" : "/ ay"}
                      </span>
                    )}
                  </div>
                  {odemePeriyodu === "yillik" && plan.fiyatAylik > 0 && (
                    <p className="text-[11px] text-af-success mt-1 font-semibold">
                      Aylık eşdeğeri: ₺{plan.fiyatYillik.toLocaleString("tr-TR")} · {Math.round((1 - plan.fiyatYillik / plan.fiyatAylik) * 100)}% tasarruf
                    </p>
                  )}
                </div>

                {/* Özellikler */}
                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.ozellikler.map((o, i) => (
                    <li key={i} className={cn("flex items-start gap-2.5 text-xs", o.aktif ? "text-af-text" : "text-af-text-disabled")}>
                      {o.aktif
                        ? <Check className={cn("w-4 h-4 flex-shrink-0 mt-0.5", plan.renkVurgu === "text-af-text-secondary" ? "text-af-success" : plan.renkVurgu)} />
                        : <X className="w-4 h-4 flex-shrink-0 mt-0.5 text-af-text-disabled opacity-40" />}
                      <span>{o.text}</span>
                    </li>
                  ))}
                </ul>

                {/* Buton */}
                <button
                  onClick={() => planSec(plan.id)}
                  disabled={aktif || !!bekleyenTalep}
                  className={cn(
                    "w-full py-3 rounded-xl text-sm font-bold transition-all",
                    aktif || !!bekleyenTalep
                      ? "bg-af-surface-2 text-af-text-disabled cursor-default border border-af-border"
                      : plan.id === "elite"
                        ? "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30"
                        : plan.id === "professional"
                          ? "bg-af-accent hover:bg-af-accent-hover text-white shadow-lg shadow-af-accent/20 hover:shadow-af-accent/30"
                          : "bg-af-surface-2 hover:bg-af-border text-white border border-af-border"
                  )}
                >
                  {aktif ? "Mevcut Planınız" : bekleyenTalep ? "Talep İnceleniyor" : plan.id === "essentials" ? "Destek ile Değiştir" : `${plan.ad}'e Geç`}
                </button>
              </div>
            )
          })}
        </div>

        {/* ── SSS / Özellik Karşılaştırma ── */}
        <div className="bg-af-surface border border-af-border rounded-2xl p-6">
          <h3 className="font-bold text-white text-base mb-5 flex items-center gap-2">
            <Shield className="w-5 h-5 text-af-accent" /> Tüm Planlarda Dahil
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: "SSL & Güvenlik", desc: "Tüm veriler şifreli" },
              { icon: Zap, label: "Hızlı CDN", desc: "Türkiye'de hızlı yükleme" },
              { icon: Receipt, label: "Şeffaf Planlar", desc: "Gizli ücret yok" },
              { icon: Sparkles, label: "AutoFlow Güncellemeleri", desc: "Otomatik yeni özellikler" },
            ].map((item) => {
              const Ic = item.icon
              return (
                <div key={item.label} className="flex items-start gap-3 p-3 bg-af-surface-2/40 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-af-accent/10 text-af-accent flex items-center justify-center flex-shrink-0">
                    <Ic className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{item.label}</p>
                    <p className="text-[10px] text-af-text-disabled">{item.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </main>

      {/* ════ ONAY MODAL ════ */}
      {onayModal && secilenPlanBilgi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-af-surface border border-af-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", secilenPlanBilgi.iconBg)}>
                <secilenPlanBilgi.icon className={cn("w-5 h-5", secilenPlanBilgi.iconColor)} />
              </div>
              <div>
                <h3 className="font-black text-white text-base">{secilenPlanBilgi.ad} Planına Geç</h3>
                <p className="text-xs text-af-text-disabled">{secilenPlanBilgi.altBaslik}</p>
              </div>
            </div>

            {/* Özet */}
            <div className="bg-af-surface-2 border border-af-border rounded-xl p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-af-text-secondary">Plan</span>
                <span className="font-bold text-white">{secilenPlanBilgi.ad}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-af-text-secondary">Ödeme</span>
                <span className="font-bold text-white capitalize">{odemePeriyodu}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-af-border pt-2 mt-2">
                <span className="text-af-text-secondary">Tutar</span>
                <span className={cn("font-black text-base", secilenPlanBilgi.renkVurgu)}>
                  {getFiyat(secilenPlanBilgi)} {odemePeriyodu === "yillik" ? "/ yıl" : "/ ay"}
                </span>
              </div>
            </div>

            <div className="mb-4 rounded-xl border border-af-accent/20 bg-af-accent/5 p-4 text-xs">
              <div className="mb-3 flex items-center gap-2 font-bold text-white">
                <Landmark className="h-4 w-4 text-af-accent" /> Havale Bilgileri
              </div>
              <dl className="space-y-2 text-af-text-secondary">
                <div className="flex justify-between gap-4"><dt>Alıcı</dt><dd className="text-right font-semibold text-white">{HAVALE_ALICI}</dd></div>
                <div className="flex justify-between gap-4"><dt>IBAN</dt><dd className="break-all text-right font-mono text-white">{HAVALE_IBAN}</dd></div>
              </dl>
            </div>

            <div className="mb-5 space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-af-text-secondary">Banka işlem/dekont referansı *</label>
                <input
                  value={havaleReferansi}
                  onChange={(event) => setHavaleReferansi(event.target.value)}
                  maxLength={120}
                  placeholder="Örn. 123456789"
                  className="w-full rounded-xl border border-af-border bg-af-surface-2 px-3 py-2.5 text-sm text-white outline-none focus:border-af-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-af-text-secondary">Not (isteğe bağlı)</label>
                <textarea
                  value={kullaniciNotu}
                  onChange={(event) => setKullaniciNotu(event.target.value)}
                  maxLength={500}
                  rows={2}
                  placeholder="Ödeme hakkında ek bilgi"
                  className="w-full resize-none rounded-xl border border-af-border bg-af-surface-2 px-3 py-2.5 text-sm text-white outline-none focus:border-af-accent"
                />
              </div>
              {hata && <p className="text-xs text-af-error">{hata}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setOnayModal(false); setSeciliPlan(null) }}
                disabled={yukleniyor || havaleReferansi.trim().length < 3}
                className="flex-1 border border-af-border hover:bg-af-surface-2 text-af-text-secondary font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Vazgeç
              </button>
              <button
                onClick={planOnay}
                disabled={yukleniyor}
                className={cn(
                  "flex-1 font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2",
                  secilenPlanBilgi.id === "elite"
                    ? "bg-amber-500 hover:bg-amber-400 text-black"
                    : "bg-af-accent hover:bg-af-accent-hover text-white"
                )}
              >
                {yukleniyor ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> İşleniyor...</>
                ) : (
                  <>Ödeme Yaptım <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ BAŞARI MODAL ════ */}
      {basariModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-af-surface border border-af-border rounded-2xl w-full max-w-sm p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-af-success/10 border border-af-success/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-af-success" />
            </div>
            <h3 className="font-black text-white text-xl mb-2">Talebiniz Alındı</h3>
            <p className="text-sm text-af-text-secondary mb-6">
              Havale bilginiz admin incelemesine gönderildi. Onaylandığında planınız otomatik olarak aktifleşecek ve bildirim alacaksınız.
            </p>
            <button
              onClick={() => setBasariModal(false)}
              className="w-full bg-af-accent hover:bg-af-accent-hover text-white font-bold py-3 rounded-xl transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
