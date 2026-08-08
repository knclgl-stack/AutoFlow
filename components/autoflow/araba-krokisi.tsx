"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface Parca {
  id: string
  label: string
  d: string
}

export const ARABA_PARCALARI: Parca[] = [
  { id: "on_tampon",         label: "Ön Tampon",         d: "M 68,8 Q 100,2 132,8 L 134,26 Q 100,20 66,26 Z" },
  { id: "on_kaput",          label: "Ön Kaput",          d: "M 66,26 Q 100,20 134,26 L 148,102 L 52,102 Z" },
  { id: "sol_on_camurluk",   label: "Sol Ön Çamurluk",  d: "M 28,58 L 66,26 L 52,102 L 28,102 Z" },
  { id: "sag_on_camurluk",   label: "Sağ Ön Çamurluk",  d: "M 172,58 L 134,26 L 148,102 L 172,102 Z" },
  { id: "sol_on_kapi",       label: "Sol Ön Kapı",       d: "M 28,102 L 52,102 L 52,200 L 28,200 Z" },
  { id: "sag_on_kapi",       label: "Sağ Ön Kapı",       d: "M 172,102 L 148,102 L 148,200 L 172,200 Z" },
  { id: "tavan",             label: "Tavan",              d: "M 52,102 L 148,102 L 148,280 L 52,280 Z" },
  { id: "sol_arka_kapi",     label: "Sol Arka Kapı",     d: "M 28,200 L 52,200 L 52,280 L 28,280 Z" },
  { id: "sag_arka_kapi",     label: "Sağ Arka Kapı",     d: "M 172,200 L 148,200 L 148,280 L 172,280 Z" },
  { id: "sol_arka_camurluk", label: "Sol Arka Çamurluk", d: "M 28,280 L 52,280 L 66,354 L 28,334 Z" },
  { id: "sag_arka_camurluk", label: "Sağ Arka Çamurluk", d: "M 172,280 L 148,280 L 134,354 L 172,334 Z" },
  { id: "arka_kaput",        label: "Arka Kaput",        d: "M 52,280 L 148,280 L 134,354 L 66,354 Z" },
  { id: "arka_tampon",       label: "Arka Tampon",       d: "M 66,354 Q 100,360 134,354 L 132,372 Q 100,378 68,372 Z" },
]

interface ArabaKrokisiProps {
  boyaliParcalar: string[]
  onChange?: (parcalar: string[]) => void
  readOnly?: boolean
  className?: string
}

export function ArabaKrokisi({ boyaliParcalar, onChange, readOnly = false, className }: ArabaKrokisiProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const toggle = (id: string) => {
    if (readOnly || !onChange) return
    const next = boyaliParcalar.includes(id)
      ? boyaliParcalar.filter((p) => p !== id)
      : [...boyaliParcalar, id]
    onChange(next)
  }

  const hoveredParca = ARABA_PARCALARI.find((p) => p.id === hoveredId)

  return (
    <div className={cn("space-y-3", className)}>
      {!readOnly && (
        <p className="text-xs text-af-text-disabled text-center">
          Boyalı parçalara tıklayarak işaretleyin
        </p>
      )}

      <div className="flex flex-col items-center gap-2">
        <svg
          viewBox="-14 -18 228 410"
          style={{ width: "min(100%, 200px)", display: "block" }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Direction labels */}
          <text x="100" y="-5" textAnchor="middle" fontSize="7" fill="rgba(148,163,184,0.5)" fontWeight="700" letterSpacing="2">ÖN</text>
          <text x="100" y="393" textAnchor="middle" fontSize="7" fill="rgba(148,163,184,0.5)" fontWeight="700" letterSpacing="2">ARKA</text>

          {/* Wheel arch indicators */}
          <ellipse cx="18" cy="70"  rx="10" ry="7" fill="rgba(10,18,30,0.8)" stroke="rgba(100,116,139,0.2)" strokeWidth="1" />
          <ellipse cx="182" cy="70"  rx="10" ry="7" fill="rgba(10,18,30,0.8)" stroke="rgba(100,116,139,0.2)" strokeWidth="1" />
          <ellipse cx="18" cy="318" rx="10" ry="7" fill="rgba(10,18,30,0.8)" stroke="rgba(100,116,139,0.2)" strokeWidth="1" />
          <ellipse cx="182" cy="318" rx="10" ry="7" fill="rgba(10,18,30,0.8)" stroke="rgba(100,116,139,0.2)" strokeWidth="1" />

          {/* Car parts */}
          {ARABA_PARCALARI.map((parca) => {
            const isSel = boyaliParcalar.includes(parca.id)
            const isHov = !readOnly && hoveredId === parca.id
            const fill = isSel
              ? isHov ? "rgba(239,68,68,0.48)" : "rgba(239,68,68,0.28)"
              : isHov ? "rgba(100,116,139,0.32)" : "rgba(71,85,105,0.14)"
            const stroke = isSel ? "rgba(220,38,38,0.8)" : isHov ? "rgba(148,163,184,0.55)" : "rgba(100,116,139,0.28)"
            return (
              <g
                key={parca.id}
                onClick={() => toggle(parca.id)}
                onMouseEnter={() => !readOnly && setHoveredId(parca.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ cursor: readOnly ? "default" : "pointer" }}
              >
                <path
                  d={parca.d}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSel ? "1.5" : "1"}
                  style={{ transition: "fill 0.12s ease, stroke 0.12s ease" }}
                />
                <title>{parca.label}{isSel ? " — Boyalı" : ""}</title>
              </g>
            )
          })}
        </svg>

        {/* Hover tooltip */}
        <div className="h-6 flex items-center justify-center">
          {hoveredParca ? (
            <span className="text-xs text-af-text-secondary font-medium px-2.5 py-0.5 bg-af-surface-2 rounded-lg border border-af-border">
              {hoveredParca.label}{boyaliParcalar.includes(hoveredParca.id) ? " ✓ Boyalı" : ""}
            </span>
          ) : (
            <span className="text-xs text-transparent select-none">-</span>
          )}
        </div>
      </div>

      {boyaliParcalar.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-af-text-disabled uppercase tracking-wider font-semibold">
            Boyalı Parçalar ({boyaliParcalar.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {boyaliParcalar.map((id) => {
              const parca = ARABA_PARCALARI.find((p) => p.id === id)
              return parca ? (
                <span key={id} className="flex items-center gap-1 text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
                  {parca.label}
                  {!readOnly && onChange && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggle(id) }}
                      className="ml-0.5 hover:text-red-200 transition-colors leading-none"
                    >×</button>
                  )}
                </span>
              ) : null
            })}
          </div>
        </div>
      ) : !readOnly ? (
        <p className="text-xs text-af-text-disabled text-center italic">Henüz parça seçilmedi</p>
      ) : null}
    </div>
  )
}
