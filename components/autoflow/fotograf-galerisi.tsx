"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface FotografGalerisiProps {
  fotograflar: string[]
  altText: string
}

export function FotografGalerisi({ fotograflar, altText }: FotografGalerisiProps) {
  const [aktifIndex, setAktifIndex] = useState(0)
  
  // Touch Swipe States
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  if (!fotograflar || fotograflar.length === 0) {
    return (
      <div className="w-full bg-af-surface-2 flex items-center justify-center text-af-text-disabled" style={{ aspectRatio: "16/10" }}>
        Fotoğraf yok
      </div>
    )
  }

  const onceki = () => setAktifIndex((i) => (i - 1 + fotograflar.length) % fotograflar.length)
  const sonraki = () => setAktifIndex((i) => (i + 1) % fotograflar.length)

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    if (isLeftSwipe) {
      sonraki()
    } else if (isRightSwipe) {
      onceki()
    }
  }

  return (
    <div 
      className="relative w-full select-none overflow-hidden" 
      style={{ aspectRatio: "16/10" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slider Wrapper */}
      <div 
        className="flex w-full h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${aktifIndex * 100}%)` }}
      >
        {fotograflar.map((foto, i) => (
          <div key={i} className="w-full h-full flex-shrink-0">
            <img
              src={foto}
              alt={`${altText} - ${i + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

      {/* Navigasyon butonları */}
      {fotograflar.length > 1 && (
        <>
          <button
            onClick={onceki}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm z-10 active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={sonraki}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors backdrop-blur-sm z-10 active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Sayaç */}
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full z-10">
            {aktifIndex + 1} / {fotograflar.length}
          </div>

          {/* Dot indikatörler */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {fotograflar.map((_, i) => (
              <button
                key={i}
                onClick={() => setAktifIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === aktifIndex ? "bg-af-accent w-4" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
