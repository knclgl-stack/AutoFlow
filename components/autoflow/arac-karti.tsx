"use client"

import Link from "next/link"
import { formatFiyat, formatKm, getAracBaslik } from "@/lib/arac-helpers"
import { DurumRozeti } from "./durum-rozeti"
import { Arac } from "@/lib/types"
import { Fuel, Gauge, Settings2, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"

interface AracKartiProps {
  arac: Arac
  href?: string
  className?: string
}

export function AracKarti({ arac, href, className }: AracKartiProps) {
  const to = href ?? `/arac/${arac.qr_slug}`

  return (
    <div className={cn("group", className)}>
      <Link href={to} className="block">
        <div className={cn(
          "bg-af-surface rounded-2xl border border-af-border overflow-hidden hover:border-af-accent/40 transition-all duration-300 hover:shadow-xl hover:shadow-af-accent/10 hover:-translate-y-1",
          arac.durum === "Satildi" && "opacity-60"
        )}>
          <div className="relative overflow-hidden bg-af-surface-2" style={{ aspectRatio: "16/10" }}>
            <img 
              src={arac.fotograflar?.[0] || "/placeholder-car.png"} 
              alt={getAracBaslik(arac)} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              loading="lazy"
              decoding="async"
            />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="absolute top-3 left-3"><DurumRozeti durum={arac.durum} size="sm" /></div>
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-0.5 rounded-full">{arac.yil}</div>
            {arac.durum === "Satildi" && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-black text-2xl tracking-widest border-4 border-white px-4 py-1 rotate-[-8deg] opacity-90">SATILDI</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-bold text-af-text text-base leading-tight mb-0.5">{arac.marka} {arac.model}</h3>
            <p className="text-sm text-af-text-disabled mb-3">{arac.versiyon}</p>
            <div className="flex items-center gap-3 text-xs text-af-text-secondary mb-4">
              <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-af-text-disabled" />{formatKm(arac.km)}</span>
              <span className="flex items-center gap-1"><Settings2 className="w-3.5 h-3.5 text-af-text-disabled" />{arac.vites}</span>
              <span className="flex items-center gap-1"><Fuel className="w-3.5 h-3.5 text-af-text-disabled" />{arac.yakit}</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                {arac.fiyat_gizle ? (
                  <span className="text-sm font-semibold text-af-accent bg-af-accent/10 px-2.5 py-1 rounded-lg border border-af-accent/20">Fiyat için arayın</span>
                ) : arac.fiyat ? (
                  <div>
                    <span className="font-black text-af-accent text-lg">{formatFiyat(arac.fiyat)}</span>
                    {arac.pazarlik_var && <span className="ml-1.5 text-xs text-af-success font-medium">Pazarlık ✓</span>}
                  </div>
                ) : null}
              </div>
              <div className="w-8 h-8 rounded-full bg-af-surface-2 group-hover:bg-af-accent/10 flex items-center justify-center transition-colors">
                <QrCode className="w-4 h-4 text-af-text-disabled group-hover:text-af-accent transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
