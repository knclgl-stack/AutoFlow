"use client"

import { PanelTopbar } from "@/components/panel/panel-topbar"
import { CreditCard } from "lucide-react"

export default function AbonelikPage() {
  return (
    <div className="flex flex-col min-h-screen bg-af-bg">
      <PanelTopbar baslik="Abonelik Yönetimi" aciklama="Paket ve ödeme planları" />
      <main className="flex-1 p-6">
        <div className="bg-af-surface border border-af-border rounded-2xl p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-af-accent/10 border border-af-accent/20 flex items-center justify-center mb-5">
            <CreditCard className="w-8 h-8 text-af-accent" />
          </div>
          <h2 className="text-xl font-black text-af-text mb-2">Abonelik Yönetimi</h2>
          <p className="text-af-text-secondary text-sm max-w-sm">
            Abonelik paketlerinizi ve fatura geçmişinizi yakında buradan yönetebileceksiniz.
          </p>
        </div>
      </main>
    </div>
  )
}
