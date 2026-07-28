"use client"

import { getQrImageUrl } from "@/lib/arac-helpers"
import { Download, ExternalLink } from "lucide-react"

interface QrDisplayProps {
  aracSlug: string
  aracAdi: string
  size?: number
  showDownload?: boolean
  showActions?: boolean
}

export function QrDisplay({
  aracSlug,
  aracAdi,
  size = 200,
  showDownload = false,
  showActions = false,
}: QrDisplayProps) {
  const qrUrl = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/arac/${aracSlug}`
  const imgUrl = getQrImageUrl(qrUrl, size)

  const handleDownload = async () => {
    try {
      const response = await fetch(imgUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `QR_${aracSlug}.png`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      // Yeni sekmede aç (fallback)
      window.open(imgUrl, "_blank")
    }
  }

  const handleOpen = () => {
    window.open(qrUrl, "_blank")
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* QR Kod */}
      <div className="bg-white rounded-2xl p-3 shadow-lg border border-slate-200">
        <img
          src={imgUrl}
          alt={`${aracAdi} QR Kodu`}
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>

      {/* Araç adı */}
      <p className="text-xs text-slate-500 text-center max-w-[200px] leading-relaxed">
        {aracAdi}
      </p>

      {/* Aksiyonlar */}
      {(showDownload || showActions) && (
        <div className="flex gap-2">
          {showDownload && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              İndir
            </button>
          )}
          {showActions && (
            <button
              onClick={handleOpen}
              className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Sayfayı Gör
            </button>
          )}
        </div>
      )}
    </div>
  )
}
