"use client"

import Link from "next/link"
import { Compass, ArrowLeft } from "lucide-react"
import { AfLogo } from "@/components/autoflow/af-logo"

export default function GlobalNotFound() {
  return (
    <div className="min-h-screen bg-af-bg text-af-text flex items-center justify-center px-5 relative overflow-hidden">
      {/* Arka plan efektleri */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-af-accent/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 text-center max-w-md w-full">
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <AfLogo variant="full" size={64} />
          </Link>
        </div>
        
        <div className="bg-af-surface border border-af-border rounded-3xl p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-af-accent/10 border border-af-accent/20 flex items-center justify-center mx-auto mb-6 text-af-accent">
            <Compass className="w-8 h-8" />
          </div>
          
          <h1 className="text-3xl font-black text-white mb-3">404</h1>
          <h2 className="text-xl font-bold text-white mb-2">Sayfa Bulunamadı</h2>
          <p className="text-af-text-secondary text-sm mb-8 leading-relaxed">
            Aradığınız sayfa mevcut değil, taşınmış veya silinmiş olabilir. Lütfen URL adresini kontrol edin.
          </p>
          
          <div className="flex flex-col gap-3">
            <Link
              href="/panel"
              className="w-full flex items-center justify-center gap-2 bg-af-accent hover:bg-af-accent-hover text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-xl hover:shadow-af-accent/25"
            >
              <ArrowLeft className="w-4 h-4" />
              Kontrol Paneline Git
            </Link>
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 border border-af-border hover:bg-af-surface-2 text-af-text-secondary hover:text-white font-semibold py-3.5 rounded-xl transition-all"
            >
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
