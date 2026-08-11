"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Clock3, Landmark, Phone, XCircle } from "lucide-react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import { createClient } from "@/lib/supabase/client"
import type { PlanTalebi } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ProfileSummary {
  user_id: string
  galeri_adi: string
  telefon?: string | null
  plan: string
}

interface HavaleClientProps {
  initialRequests: PlanTalebi[]
  profileMap: Record<string, ProfileSummary>
}

const statusLabels = {
  bekliyor: "Bekliyor",
  onaylandi: "Onaylandı",
  reddedildi: "Reddedildi",
}

export function HavaleClient({ initialRequests, profileMap }: HavaleClientProps) {
  const supabase = createClient()
  const [requests, setRequests] = useState(initialRequests)
  const [filter, setFilter] = useState<"bekliyor" | "tum">("bekliyor")
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const visibleRequests = useMemo(
    () => filter === "tum" ? requests : requests.filter((request) => request.durum === "bekliyor"),
    [filter, requests]
  )

  const pendingCount = requests.filter((request) => request.durum === "bekliyor").length

  async function review(request: PlanTalebi, decision: "onaylandi" | "reddedildi") {
    const action = decision === "onaylandi" ? "onaylamak" : "reddetmek"
    if (!window.confirm(`${profileMap[request.user_id]?.galeri_adi || "Bu galeri"} talebini ${action} istediğinize emin misiniz?`)) return

    setProcessingId(request.id)
    setMessage(null)

    try {
      const { error } = await supabase.rpc("review_plan_request", {
        p_request_id: request.id,
        p_decision: decision,
        p_admin_note: adminNote[request.id]?.trim() || null,
      })

      if (error) throw error

      setRequests((current) => current.map((item) =>
        item.id === request.id
          ? {
              ...item,
              durum: decision,
              admin_notu: adminNote[request.id]?.trim() || null,
              reviewed_at: new Date().toISOString(),
            }
          : item
      ))
      setMessage({
        type: "success",
        text: decision === "onaylandi"
          ? `${request.talep_edilen_plan} planı aktif edildi.`
          : "Talep reddedildi.",
      })
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Talep değerlendirilemedi." })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-af-bg text-af-text">
      <PanelTopbar baslik="Havale Talepleri" aciklama={`${pendingCount} talep onay bekliyor`} />

      <main className="w-full flex-1 space-y-5 p-6">
        {message && (
          <div className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            message.type === "success"
              ? "border-af-success/30 bg-af-success/10 text-af-success"
              : "border-af-error/30 bg-af-error/10 text-af-error"
          )}>
            {message.text}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("bekliyor")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold",
              filter === "bekliyor" ? "bg-af-accent text-white" : "border border-af-border bg-af-surface text-af-text-secondary"
            )}
          >
            Bekleyenler ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("tum")}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold",
              filter === "tum" ? "bg-af-accent text-white" : "border border-af-border bg-af-surface text-af-text-secondary"
            )}
          >
            Tüm Talepler
          </button>
        </div>

        {visibleRequests.length === 0 ? (
          <div className="rounded-2xl border border-af-border bg-af-surface p-12 text-center">
            <Landmark className="mx-auto mb-4 h-10 w-10 text-af-text-disabled" />
            <h2 className="font-bold text-white">Gösterilecek talep yok</h2>
            <p className="mt-1 text-sm text-af-text-secondary">Yeni havale bildirimleri burada görünecek.</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleRequests.map((request) => {
              const profile = profileMap[request.user_id]
              const isPending = request.durum === "bekliyor"

              return (
                <article key={request.id} className="rounded-2xl border border-af-border bg-af-surface p-5 shadow-xl">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-black text-white">{profile?.galeri_adi || "Bilinmeyen Galeri"}</h2>
                      {profile?.telefon && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-af-text-secondary">
                          <Phone className="h-3.5 w-3.5" /> {profile.telefon}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-bold",
                      request.durum === "bekliyor" && "border-amber-500/30 bg-amber-500/10 text-amber-300",
                      request.durum === "onaylandi" && "border-af-success/30 bg-af-success/10 text-af-success",
                      request.durum === "reddedildi" && "border-af-error/30 bg-af-error/10 text-af-error"
                    )}>
                      {statusLabels[request.durum]}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 rounded-xl border border-af-border bg-af-surface-2/50 p-4 text-xs">
                    <div><dt className="text-af-text-disabled">Mevcut plan</dt><dd className="mt-1 font-bold text-white">{request.mevcut_plan}</dd></div>
                    <div><dt className="text-af-text-disabled">Talep edilen</dt><dd className="mt-1 font-bold text-af-accent">{request.talep_edilen_plan}</dd></div>
                    <div><dt className="text-af-text-disabled">Dönem</dt><dd className="mt-1 font-bold text-white">{request.odeme_periyodu === "yillik" ? "Yıllık" : "Aylık"}</dd></div>
                    <div><dt className="text-af-text-disabled">Tutar</dt><dd className="mt-1 font-bold text-white">₺{Number(request.tutar).toLocaleString("tr-TR")}</dd></div>
                    <div className="col-span-2"><dt className="text-af-text-disabled">Havale referansı</dt><dd className="mt-1 break-all font-mono font-bold text-white">{request.havale_referansi}</dd></div>
                    <div className="col-span-2"><dt className="text-af-text-disabled">Talep zamanı</dt><dd className="mt-1 text-white">{new Date(request.created_at).toLocaleString("tr-TR")}</dd></div>
                    {request.kullanici_notu && <div className="col-span-2"><dt className="text-af-text-disabled">Kullanıcı notu</dt><dd className="mt-1 text-white">{request.kullanici_notu}</dd></div>}
                  </dl>

                  {isPending ? (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={adminNote[request.id] || ""}
                        onChange={(event) => setAdminNote((current) => ({ ...current, [request.id]: event.target.value }))}
                        maxLength={500}
                        rows={2}
                        placeholder="Admin notu (isteğe bağlı)"
                        className="w-full resize-none rounded-xl border border-af-border bg-af-surface-2 px-3 py-2 text-sm text-white outline-none focus:border-af-accent"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => review(request, "reddedildi")}
                          disabled={processingId === request.id}
                          className="flex items-center justify-center gap-2 rounded-xl border border-af-error/30 bg-af-error/10 py-2.5 text-sm font-bold text-af-error disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" /> Reddet
                        </button>
                        <button
                          onClick={() => review(request, "onaylandi")}
                          disabled={processingId === request.id}
                          className="flex items-center justify-center gap-2 rounded-xl bg-af-success py-2.5 text-sm font-bold text-white disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" /> Onayla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-2 text-xs text-af-text-secondary">
                      <Clock3 className="h-3.5 w-3.5" />
                      {request.reviewed_at ? new Date(request.reviewed_at).toLocaleString("tr-TR") : "Değerlendirildi"}
                      {request.admin_notu && ` · ${request.admin_notu}`}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
