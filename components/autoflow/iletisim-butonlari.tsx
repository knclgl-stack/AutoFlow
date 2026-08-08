"use client"

import { Phone, MessageCircle, Share2, Copy, Check } from "lucide-react"
import { Arac, Galeri } from "@/lib/types"
import { getWhatsAppUrl, getAracTamBaslik } from "@/lib/arac-helpers"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface IletisimButonlariProps {
  arac: Arac
  galeri: Galeri
  variant?: "sticky" | "inline"
  eventId?: string | null
}

export function IletisimButonlari({ arac, galeri, variant = "sticky", eventId }: IletisimButonlariProps) {
  const [copied, setCopied] = useState(false)
  const [showShare, setShowShare] = useState(false)

  const whatsappUrl = galeri.whatsapp
    ? getWhatsAppUrl(
        galeri.whatsapp,
        arac,
        typeof window !== "undefined" ? window.location.origin : "https://autoflow.com.tr"
      )
    : ""
  const phoneUrl = galeri.telefon ? `tel:${galeri.telefon.replace(/\s/g, "")}` : ""

  const handleWhatsAppClick = async () => {
    if (!eventId) return
    try {
      const supabase = createClient()
      await supabase
        .from("qr_events")
        .update({ whatsapp_tiklamasi: true })
        .eq("id", eventId)
    } catch (err) {
      console.error("WhatsApp tıklaması kaydedilemedi:", err)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleNativeShare = async () => {
    const isPremium = galeri.plan === "Elite" || galeri.plan === "Professional"
    const shareText = isPremium ? getAracTamBaslik(arac) : `${getAracTamBaslik(arac)} — AutoFlow`

    if (navigator.share) {
      await navigator.share({
        title: getAracTamBaslik(arac),
        text: shareText,
        url: window.location.href,
      })
    } else {
      setShowShare((s) => !s)
    }
  }

  if (variant === "sticky") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-af-bg/95 backdrop-blur-md border-t border-af-border px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex gap-3">
          {/* WhatsApp */}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white font-semibold py-3.5 rounded-2xl transition-colors text-sm shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp ile Yaz
            </a>
          )}

          {/* Ara */}
          {phoneUrl && (
            <a
              href={phoneUrl}
              className={cn(
                "flex items-center justify-center bg-af-accent hover:bg-af-accent-hover text-white rounded-2xl transition-colors shadow-lg shadow-af-accent/20",
                whatsappUrl ? "w-14" : "flex-1 py-3.5"
              )}
            >
              <Phone className="w-5 h-5" />
              {!whatsappUrl && <span className="ml-2 font-semibold text-sm">Ara</span>}
            </a>
          )}

          {/* Paylaş */}
          <button
            onClick={handleNativeShare}
            className={cn(
              "flex items-center justify-center bg-af-surface hover:bg-af-surface-2 border border-af-border text-af-text-secondary rounded-2xl transition-colors relative",
              (!whatsappUrl && !phoneUrl) ? "flex-1 py-3.5" : "w-14"
            )}
          >
            <Share2 className="w-4 h-4" />
            {(!whatsappUrl && !phoneUrl) && <span className="ml-2 font-semibold text-sm">Paylaş</span>}
            
            {showShare && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-af-surface border border-af-border rounded-xl shadow-xl p-1 z-50">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 w-full text-sm text-af-text-secondary hover:bg-af-surface-2 px-3 py-2 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-af-success" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Kopyalandı!" : "Linki Kopyala"}
                </button>
              </div>
            )}
          </button>
        </div>
      </div>
    )
  }

  // Inline
  return (
    <div className="flex gap-3">
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
      )}
      {phoneUrl && (
        <a
          href={phoneUrl}
          className="flex-1 flex items-center justify-center gap-2 border border-af-border hover:bg-af-surface-2 text-af-text-secondary font-medium py-3 px-4 rounded-xl transition-colors text-sm"
        >
          <Phone className="w-4 h-4" />
          Ara
        </a>
      )}
    </div>
  )
}
