"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface FotografGalerisiProps {
  fotograflar: string[]
  altText: string
}

export function FotografGalerisi({ fotograflar, altText }: FotografGalerisiProps) {
  const [aktifIndex, setAktifIndex] = useState(0)

  if (!fotograflar || fotograflar.length === 0) {
    return (
      <div className="w-full bg-af-surface-2 flex items-center justify-center text-af-text-disabled" style={{ aspectRatio: "16/10" }}>
        Fotoğraf yok
      </div>
    )
  }

  const onceki = () => setAktifIndex((i) => (i - 1 + fotograflar.length) % fotograflar.length)
  const sonraki = () => setAktifIndex((i) => (i + 1) % fotograflar.length)

  return (
    <div className="relative w-full select-none" style={{ aspectRatio: "16/10" }}>
      {/* Ana görsel */}
      <img
        key={aktifIndex}
        src={fotograflar[aktifIndex]}
        alt={`${altText} - ${aktifIndex + 1}`}
        className="w-full h-full object-cover"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

      {/* Navigasyon butonları */}
      {fotograflar.length > 1 && (
        <>
          <button
            onClick={onceki}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={sonraki}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Sayaç */}
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
            {aktifIndex + 1} / {fotograflar.length}
          </div>

          {/* Dot indikatörler */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {fotograflar.map((_, i) => (
              <button
                key={i}
                onClick={() => setAktifIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === aktifIndex ? "bg-af-accent w-4" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
