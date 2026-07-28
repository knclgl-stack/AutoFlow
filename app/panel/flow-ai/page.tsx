"use client"

import { PanelTopbar } from "@/components/panel/panel-topbar"
import { Sparkles } from "lucide-react"

export default function FlowAiPage() {
  return (
    <div className="flex flex-col min-h-screen bg-af-bg">
      <PanelTopbar baslik="Flow AI" aciklama="Yapay zeka asistanı" />
      <main className="flex-1 p-6">
        <div className="bg-af-surface border border-af-border rounded-2xl p-16 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-af-accent/10 border border-af-accent/20 flex items-center justify-center mb-5">
            <Sparkles className="w-8 h-8 text-af-accent animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-af-text mb-2">Flow AI</h2>
          <p className="text-af-text-secondary text-sm max-w-sm">
            Yapay zeka destekli araç yönetimi asistanınız çok yakında burada olacak.
          </p>
        </div>
      </main>
    </div>
  )
}
