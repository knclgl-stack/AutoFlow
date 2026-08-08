"use client"

import { useEffect, useState } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { HelpCircle, Phone, MessageSquare, Mail, CheckCircle2, Star, Crown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function DestekPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [dbPlan, setDbPlan] = useState("Essential")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function planYukle() {
      if (!user) return
      try {
        const { data } = await supabase
          .from("galeri_profilleri")
          .select("plan")
          .eq("user_id", user.id)
          .single()
        if (data && data.plan) {
          setDbPlan(data.plan)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    planYukle()
  }, [user])

  const [form, setForm] = useState({ konu: "", mesaj: "" })
  const [gonderildi, setGonderildi] = useState(false)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    setGonderildi(true)
    setTimeout(() => {
      setForm({ konu: "", mesaj: "" })
    }, 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-af-bg">
        <PanelTopbar baslik="Destek & Yardım" />
        <main className="flex-1 p-6 flex justify-center items-center">
          <span className="w-10 h-10 border-4 border-af-accent/30 border-t-af-accent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-af-bg text-af-text">
      <PanelTopbar baslik="Destek & Yardım" aciklama="7/24 Teknik destek portalı" />

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">

        {/* PLAN BAZLI ÖZEL DESTEK KARTI */}
        {dbPlan === "Elite" && (
          <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-af-surface p-6 shadow-xl shadow-amber-500/5">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-amber-500/5 -translate-y-8 translate-x-8" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-400/25">
                  <Crown className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Elite 7/24 Öncelikli Hizmet</span>
                  <h2 className="text-xl font-black text-white">Size Özel Müşteri Temsilcisi</h2>
                </div>
              </div>
              <p className="text-sm text-af-text-secondary leading-relaxed max-w-xl">
                Elite üye olarak destek ekibimize 7 gün 24 saat anında ulaşabilirsiniz. Telefon araması veya öncelikli WhatsApp hattımız üzerinden doğrudan atanmış temsilcinizle görüşün.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="https://wa.me/905550000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-500/25 text-sm"
                >
                  <MessageSquare className="w-4 h-4" /> 7/24 WhatsApp Öncelikli Destek
                </a>
                <a
                  href="tel:+905550000000"
                  className="flex items-center justify-center gap-2 bg-af-surface-2 border border-af-border hover:border-amber-500/30 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm"
                >
                  <Phone className="w-4 h-4 text-amber-400" /> +90 555 000 00 00
                </a>
              </div>
            </div>
          </div>
        )}

        {dbPlan === "Professional" && (
          <div className="relative overflow-hidden rounded-2xl border border-af-accent/20 bg-af-surface p-6 shadow-xl shadow-af-accent/5">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-af-accent/5 -translate-y-8 translate-x-8" />
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-af-accent/10 flex items-center justify-center border border-af-accent/25">
                  <Star className="w-6 h-6 text-af-accent" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-af-accent">Professional Standart Hizmet</span>
                  <h2 className="text-xl font-black text-white">Hızlı Yanıt Garantili Teknik Destek</h2>
                </div>
              </div>
              <p className="text-sm text-af-text-secondary leading-relaxed max-w-xl">
                Mesai saatleri içerisinde (09:00 - 18:00) 1 saat içinde geri dönüş garantili e-posta veya standart WhatsApp desteğimizden yararlanabilirsiniz.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="https://wa.me/905550000000"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-af-accent hover:bg-af-accent-hover text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-af-accent/25 text-sm"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp Destek Hattı
                </a>
              </div>
            </div>
          </div>
        )}

        {dbPlan === "Essential" && (
          <div className="relative overflow-hidden rounded-2xl border border-af-border bg-af-surface p-6">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-af-surface-2 flex items-center justify-center border border-af-border">
                    <HelpCircle className="w-6 h-6 text-af-text-disabled" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-af-text-disabled">Essential Standart Destek</span>
                    <h2 className="text-lg font-black text-white">E-posta ile Teknik Destek</h2>
                  </div>
                </div>
                <p className="text-sm text-af-text-secondary leading-relaxed max-w-md">
                  Ücretsiz planda destek talepleriniz e-posta üzerinden alınır ve 24-48 saat içinde yanıtlanır. Anında destek ve 7/24 öncelikli iletişim için paketinizi yükseltin.
                </p>
              </div>
              <Link
                href="/panel/abonelik"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-af-accent to-purple-600 hover:from-af-accent-hover hover:to-purple-500 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-af-accent/20 text-sm whitespace-nowrap"
              >
                7/24 Elite Desteğe Geç <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* DESTEK TALEBİ GÖNDERME FORMU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Sol Kolon: Form */}
          <div className="md:col-span-2 bg-af-surface border border-af-border rounded-2xl p-6">
            <h3 className="font-bold text-white text-base mb-4">Destek Talebi Oluştur</h3>

            {gonderildi ? (
              <div className="bg-af-success/10 border border-af-success/20 text-af-success rounded-xl p-5 text-center space-y-3 py-10">
                <CheckCircle2 className="w-12 h-12 mx-auto animate-bounce" />
                <h4 className="font-bold text-white text-base">Talebiniz Alındı!</h4>
                <p className="text-xs text-af-text-secondary">
                  Destek ekibimiz en kısa sürede e-posta adresiniz üzerinden geri dönüş sağlayacaktır.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Konu / Başlık</label>
                  <input
                    type="text"
                    required
                    value={form.konu}
                    onChange={(e) => setForm({ ...form, konu: e.target.value })}
                    placeholder="Örn: Görsel yükleme hatası"
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Açıklama / Mesajınız</label>
                  <textarea
                    required
                    rows={5}
                    value={form.mesaj}
                    onChange={(e) => setForm({ ...form, mesaj: e.target.value })}
                    placeholder="Yaşadığınız sorunu detaylıca açıklayın..."
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-af-accent hover:bg-af-accent-hover text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm shadow-md hover:shadow-lg shadow-af-accent/20"
                >
                  <Mail className="w-4 h-4" /> Talep Gönder
                </button>
              </form>
            )}
          </div>

          {/* Sağ Kolon: İletişim Bilgileri */}
          <div className="space-y-4">
            <div className="bg-af-surface border border-af-border rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm">Resmi İletişim</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <Mail className="w-4 h-4 text-af-accent" />
                  <div>
                    <p className="text-af-text-disabled">Destek E-posta</p>
                    <a href="mailto:support@autoflow.com" className="text-white hover:text-af-accent font-medium">support@autoflow.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Phone className="w-4 h-4 text-af-accent" />
                  <div>
                    <p className="text-af-text-disabled">Müşteri İlişkileri</p>
                    <span className="text-white font-medium">+90 212 000 00 00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
