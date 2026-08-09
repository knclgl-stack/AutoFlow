"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ChevronDown, MapPin, Clock, ExternalLink, QrCode, Sparkles, X, Send } from "lucide-react"
import Link from "next/link"
import { FotografGalerisi } from "@/components/autoflow/fotograf-galerisi"
import { DurumRozeti } from "@/components/autoflow/durum-rozeti"
import { IletisimButonlari } from "@/components/autoflow/iletisim-butonlari"
import { ArabaKrokisi } from "@/components/autoflow/araba-krokisi"
import { formatFiyat, formatKm, getOzellikIcon } from "@/lib/arac-helpers"
import { Arac, Galeri } from "@/lib/types"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface AracDetayClientProps {
  arac: Arac
  galeri: Galeri
}

const SPEC_SECTIONS = [
  {
    baslik: "Teknik Özellikler",
    items: (a: Arac) => [
      { label: "Motor Hacmi", value: a.motor_hacmi ? `${a.motor_hacmi} cc` : "—" },
      { label: "Motor Gücü", value: a.motor_gucu ? `${a.motor_gucu} HP` : "—" },
      { label: "Vites Tipi", value: a.vites },
      { label: "Yakıt Tipi", value: a.yakit },
      { label: "Kasa Tipi", value: a.kasa_tipi },
      { label: "Kilometre", value: formatKm(a.km) },
    ],
  },
  {
    baslik: "Durum Bilgisi",
    items: (a: Arac) => [
      { label: "Hasar Kaydı", value: a.hasar_kaydi ? "Var ⚠️" : "Yok ✅" },
      { label: "Boyalı Parça", value: a.boyali_parca === 0 ? "Yok ✅" : `${a.boyali_parca} parça` },
      { label: "Tramer Kaydı", value: (a.tramer_kaydi ?? false) ? `Var (⚠️ ${(a.tramer_detay ?? []).length} kayıt)` : "Yok ✅" },
      { label: "Ağır Hasar", value: (a.agir_hasar_kaydi ?? false) ? "Var ⚠️" : "Yok ✅" },
      { label: "Araç Durumu", value: a.durum === "Aktif" ? "Satışta" : a.durum === "Satildi" ? "Satıldı" : "Pasif" },
      { label: "Renk", value: a.renk },
    ],
  },
]

export function AracDetayClient({ arac, galeri }: AracDetayClientProps) {
  const [specsOpen, setSpecsOpen] = useState(false)
  const [eventId, setEventId] = useState<string | null>(null)

  // Flow AI Chatbot States
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  // Welcome message initialization
  useEffect(() => {
    if (chatOpen && chatMessages.length === 0) {
      setChatMessages([
        {
          sender: "ai",
          text: `Merhaba! Ben ${galeri.ad || 'AutoFlow'} Satış Danışmanı Flow AI. 🤖\n\nBu harika ${arac.yil} model ${arac.marka} ${arac.model} hakkında aklınıza takılan tüm soruları (tramer, km, boya/değişen, donanımlar vb.) yanıtlamak ve size yardımcı olmak için buradayım. Nasıl yardımcı olabilirim?`
        }
      ])
    }
  }, [chatOpen, chatMessages.length, galeri.ad, arac.yil, arac.marka, arac.model])

  const handleSendChatMessage = async (textToSend?: string) => {
    const messageText = textToSend || chatInput
    if (!messageText.trim() || chatLoading) return

    // Add user message
    const newMessages = [...chatMessages, { sender: "user" as const, text: messageText }]
    setChatMessages(newMessages)
    if (!textToSend) setChatInput("")
    setChatLoading(true)

    try {
      const response = await fetch("/api/arac-danismani", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          history: chatMessages,
          arac,
          galeri,
        }),
      })

      const responseText = await response.text()
      let data: any
      try {
        data = JSON.parse(responseText)
      } catch (parseErr) {
        throw new Error(`Sunucudan geçersiz yanıt geldi (HTML/Hata sayfası). Kod: ${response.status}. Detay: ${responseText.slice(0, 100)}...`)
      }

      if (data.reply) {
        setChatMessages((prev) => [...prev, { sender: "ai", text: data.reply }])
      } else {
        setChatMessages((prev) => [
          ...prev,
          { sender: "ai", text: `İşlem Başarısız: ${data.error || "Bilinmeyen bir hata oluştu."}` },
        ])
      }
    } catch (error: any) {
      console.error("Chat error:", error)
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai", text: `Bağlantı Hatası: ${error?.message || "İnternet bağlantınızı kontrol edip tekrar deneyin."}` },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  useEffect(() => {
    const registerScan = async () => {
      try {
        const uAgent = navigator.userAgent
        let deviceType: "mobile" | "tablet" | "desktop" = "desktop"
        if (/mobi/i.test(uAgent)) {
          deviceType = "mobile"
        } else if (/ipad|tablet/i.test(uAgent)) {
          deviceType = "tablet"
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(arac.id)
        if (!isUuid) return

        const supabase = createClient()
        const { data, error } = await supabase
          .from("qr_events")
          .insert({
            arac_id: arac.id,
            device_type: deviceType,
            whatsapp_tiklamasi: false,
          })
          .select("id")
          .single()

        if (data && !error) {
          setEventId(data.id)
        } else if (error) {
          console.error("QR okutma loglanamadı:", error)
        }
      } catch (err) {
        console.error("QR okutma kaydı sırasında hata:", err)
      }
    }

    registerScan()
  }, [arac.id])

  const initials = galeri.ad
    ? galeri.ad
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "G"

  return (
    <div className="min-h-screen bg-af-bg pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-af-bg/95 backdrop-blur-md border-b border-af-border">
        <Link href={`/galeri/${galeri.slug}`} className="w-9 h-9 rounded-full bg-af-surface border border-af-border flex items-center justify-center hover:border-af-accent/40 transition-colors">
          <ArrowLeft className="w-4 h-4 text-af-text-secondary" />
        </Link>
        <span className="font-semibold text-af-text text-sm truncate max-w-[200px]">{arac.marka} {arac.model}</span>
        <Link href={`/panel/qr?arac=${arac.id}`} className="w-9 h-9 rounded-full bg-af-surface border border-af-border flex items-center justify-center hover:border-af-accent/40 transition-colors">
          <QrCode className="w-4 h-4 text-af-text-secondary" />
        </Link>
      </div>

      <div className="max-w-lg mx-auto">
        {/* FOTOĞRAF */}
        <div className="relative">
          <FotografGalerisi fotograflar={arac.fotograflar} altText={`${arac.marka} ${arac.model}`} />
          {arac.durum === "Satildi" && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
              <div className="text-center">
                <span className="text-white font-black text-4xl tracking-[0.2em] border-4 border-white px-6 py-2 rounded-lg inline-block rotate-[-8deg] shadow-2xl">SATILDI</span>
                <p className="text-white/70 text-sm mt-4">Bu araç artık mevcut değil</p>
              </div>
            </div>
          )}
        </div>
        {arac.fotograflar.length > 1 && <div className="h-14" />}

        <div className="px-5 pt-5">
          {/* BAŞLIK */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <DurumRozeti durum={arac.durum} size="sm" />
              <span className="text-af-text-disabled text-sm">{arac.yil}</span>
            </div>
            <h1 className="text-2xl font-black text-af-text leading-tight">{arac.marka} {arac.model}</h1>
            <p className="text-af-text-secondary text-base mt-1">{arac.versiyon}</p>

            {/* FİYAT */}
            <div className="mt-4 p-4 bg-af-surface rounded-2xl border border-af-border">
              {arac.fiyat_gizle ? (
                <div>
                  <p className="text-af-accent font-bold text-lg">Fiyat için iletişime geçin</p>
                  <p className="text-af-text-secondary text-sm mt-0.5">Satış ekibimizle konuşun</p>
                </div>
              ) : arac.fiyat ? (
                <div>
                  <p className="text-3xl font-black text-af-accent">{formatFiyat(arac.fiyat)}</p>
                  {arac.pazarlik_var && (
                    <span className="inline-flex items-center gap-1 mt-2 text-af-success text-sm font-semibold bg-af-success/10 px-2.5 py-0.5 rounded-full border border-af-success/20">✓ Pazarlığa Açık</span>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* HIZLI SPEC CHİP'LERİ */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {[
              { icon: "📍", label: "Kilometre", value: formatKm(arac.km) },
              { icon: "⚙️", label: "Vites", value: arac.vites },
              { icon: "⛽", label: "Yakıt", value: arac.yakit },
              { icon: "🎨", label: "Renk", value: arac.renk },
              { icon: "🏎️", label: "Kasa", value: arac.kasa_tipi },
              { icon: "🗓️", label: "Yıl", value: String(arac.yil) },
            ].map((chip) => (
              <div key={chip.label} className="flex items-center gap-2.5 bg-af-surface rounded-xl p-3 border border-af-border">
                <span className="text-lg leading-none">{chip.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs text-af-text-disabled leading-none mb-0.5">{chip.label}</p>
                  <p className="text-sm font-semibold text-af-text truncate">{chip.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* AÇIKLAMA */}
          {arac.aciklama && (
            <div className="mt-5 bg-af-surface rounded-2xl border border-af-border p-5">
              <h3 className="font-bold text-white text-sm mb-2.5">Araç Açıklaması</h3>
              <p className="text-af-text-secondary text-sm leading-relaxed whitespace-pre-line">
                {arac.aciklama}
              </p>
            </div>
          )}

          {/* TEKNİK DETAYLAR Accordion */}
          <div className="mt-5">
            <button onClick={() => setSpecsOpen((s) => !s)}
              className="w-full flex items-center justify-between py-3.5 px-4 bg-af-surface rounded-2xl border border-af-border text-left hover:border-af-accent/30 transition-colors">
              <span className="font-semibold text-af-text text-sm">Teknik Özellikler</span>
              <ChevronDown className={cn("w-4 h-4 text-af-text-disabled transition-transform duration-300", specsOpen && "rotate-180")} />
            </button>
            {specsOpen && (
              <div>
                {SPEC_SECTIONS.map((section) => (
                  <div key={section.baslik} className="mt-3">
                    <p className="text-xs font-semibold text-af-text-disabled uppercase tracking-wider mb-2 px-1">{section.baslik}</p>
                    <div className="bg-af-surface rounded-xl border border-af-border divide-y divide-af-border">
                      {section.items(arac).map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-3">
                          <span className="text-af-text-secondary text-sm">{label}</span>
                          <span className="text-af-text text-sm font-semibold">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Boyalı Parça Krokisi */}
                {(arac.boyali_parcalar ?? []).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-af-text-disabled uppercase tracking-wider mb-2 px-1">Boyalı Parça Krokisi</p>
                    <div className="bg-af-surface rounded-xl border border-af-border p-4">
                      <ArabaKrokisi
                        boyaliParcalar={arac.boyali_parcalar ?? []}
                        readOnly
                      />
                    </div>
                  </div>
                )}

                {/* Tramer Detay Tablosu */}
                {(arac.tramer_kaydi ?? false) && (arac.tramer_detay ?? []).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-af-text-disabled uppercase tracking-wider mb-2 px-1">Tramer Kayıtları</p>
                    <div className="bg-af-surface rounded-xl border border-af-border overflow-hidden">
                      <div className="grid grid-cols-2 bg-af-surface-2 px-4 py-2 border-b border-af-border">
                        <span className="text-xs font-semibold text-af-text-disabled uppercase tracking-wider">Yıl</span>
                        <span className="text-xs font-semibold text-af-text-disabled uppercase tracking-wider">Tutar</span>
                      </div>
                      {(arac.tramer_detay ?? []).map((t: { yil: number; tutar: number }, i: number) => (
                        <div key={i} className="grid grid-cols-2 px-4 py-3 border-b border-af-border last:border-b-0">
                          <span className="text-sm font-semibold text-af-text">{t.yil}</span>
                          <span className="text-sm text-af-text-secondary">
                            {t.tutar ? `₺${Number(t.tutar).toLocaleString("tr-TR")}` : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DONANIM LİSTESİ */}
          {arac.ozellikler.length > 0 && (
            <div className="mt-5">
              <h2 className="font-bold text-af-text mb-3">Donanımlar</h2>
              <div className="grid grid-cols-1 gap-1.5">
                {arac.ozellikler.map((oz, i) => (
                  <div key={i} className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-af-surface border border-af-border">
                    <span className="text-base">{getOzellikIcon(oz)}</span>
                    <span className="text-sm text-af-text-secondary">{oz}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GALERİ BİLGİSİ */}
          <div className={cn(
            "mt-6 p-4 rounded-2xl border transition-all duration-300 bg-af-surface",
            galeri.plan === "Elite" ? "border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]" : "border-af-border"
          )}>
            <h2 className="font-bold text-af-text mb-3">Satıcı</h2>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg transition-all duration-300",
                galeri.plan === "Elite" 
                  ? "bg-gradient-to-br from-amber-400 to-amber-600 shadow-md shadow-amber-500/25 text-black" 
                  : "bg-af-accent shadow-lg shadow-af-accent/25"
              )}>
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-af-text">{galeri.ad}</p>
                  {galeri.plan === "Elite" && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                      ELİTE
                    </span>
                  )}
                </div>
                <span className="text-xs text-af-accent bg-af-accent/10 px-2 py-0.5 rounded-full border border-af-accent/20">Yetkili Galeri</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-af-text-secondary">
                <MapPin className="w-4 h-4 text-af-text-disabled flex-shrink-0" /><span>{galeri.adres}, {galeri.sehir}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-af-text-secondary">
                <Clock className="w-4 h-4 text-af-text-disabled flex-shrink-0" />
                <span>Hft. İçi {galeri.calisma_saatleri.hafta_ici} · Hft. Sonu {galeri.calisma_saatleri.hafta_sonu}</span>
              </div>
            </div>
            <Link href={`/galeri/${galeri.slug}`} className="mt-3 flex items-center gap-1.5 text-sm text-af-accent font-medium hover:text-af-accent-hover transition-colors">
              Tüm araçları gör <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {arac.durum === "Satildi" && (
            <div className="mt-5 p-4 bg-af-surface rounded-2xl border border-af-border">
              <p className="text-sm text-af-text-secondary mb-3">Bu araç satılmış olsa da benzer araçlar için galeri ile iletişime geçebilirsiniz.</p>
              <IletisimButonlari arac={arac} galeri={galeri} variant="inline" eventId={eventId} />
            </div>
          )}
          <div className="h-24" />
        </div>
      </div>

      {arac.durum !== "Satildi" && <IletisimButonlari arac={arac} galeri={galeri} variant="sticky" eventId={eventId} />}

      {/* FLOW AI WIDGET */}
      {arac.durum !== "Satildi" && (
        <>
          {/* Floating Bubble Button */}
          {!chatOpen && (
            <button
              onClick={() => setChatOpen(true)}
              className="fixed bottom-24 right-5 w-14 h-14 bg-gradient-to-tr from-af-accent to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-af-accent/30 text-white hover:scale-105 active:scale-95 transition-all z-40 border border-white/10"
              title="Flow AI Satış Danışmanı"
            >
              <Sparkles className="w-6 h-6 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </button>
          )}

          {/* Chat Window Panel */}
          {chatOpen && (
            <div className="fixed bottom-20 right-4 left-4 md:left-auto md:w-96 h-[500px] bg-af-surface/95 backdrop-blur-md border border-af-border rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in">
              {/* Header */}
              <div className="bg-gradient-to-r from-af-accent/20 to-purple-600/10 px-4 py-3.5 border-b border-af-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-af-accent to-purple-600 flex items-center justify-center text-white">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Flow AI</h4>
                    <p className="text-[10px] text-af-text-secondary leading-none">{galeri.ad} Satış Danışmanı</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Aktif
                  </span>
                  <button
                    onClick={() => setChatOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-af-surface-2 text-af-text-disabled hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex flex-col max-w-[82%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-line shadow-sm",
                      msg.sender === "user"
                        ? "bg-af-accent text-white ml-auto rounded-tr-none"
                        : "bg-af-surface-2 border border-af-border text-af-text mr-auto rounded-tl-none"
                    )}
                  >
                    {msg.text}
                  </div>
                ))}
                {chatLoading && (
                  <div className="bg-af-surface-2 border border-af-border text-af-text mr-auto rounded-2xl rounded-tl-none p-3 max-w-[80%] flex items-center gap-1">
                    <span className="h-2 w-2 bg-af-text-disabled rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 bg-af-text-disabled rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 bg-af-text-disabled rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                )}
              </div>

              {/* Quick Suggestion Chips */}
              <div className="px-4 py-2 bg-af-surface-2 border-t border-af-border overflow-x-auto flex gap-2 whitespace-nowrap scrollbar-none" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {[
                  "Fiyatta pazarlık var mı?",
                  "Tramer / hasar durumu nedir?",
                  "Aracın boyalı kısımları neresi?",
                  "Araçta hangi özellikler var?"
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendChatMessage(q)}
                    disabled={chatLoading}
                    className="inline-block text-xs font-semibold text-af-text-secondary bg-af-surface hover:text-white hover:border-af-accent/40 border border-af-border px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Input Footer */}
              <div className="p-3 bg-af-surface border-t border-af-border flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Araç hakkında soru sorun..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendChatMessage()
                  }}
                  disabled={chatLoading}
                  className="flex-1 bg-af-surface-2 border border-af-border rounded-xl px-3.5 py-2 text-sm text-af-text placeholder-af-text-disabled focus:outline-none focus:border-af-accent/50 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendChatMessage()}
                  disabled={chatLoading || !chatInput.trim()}
                  className="w-9 h-9 bg-af-accent text-white rounded-xl flex items-center justify-center hover:bg-af-accent-hover active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
