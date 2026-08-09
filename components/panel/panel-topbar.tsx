"use client"

import { useState, useEffect } from "react"
import { Bell, Search, Plus, CheckCircle, Gift } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface PanelTopbarProps {
  baslik?: string
  aciklama?: string
}

export function PanelTopbar({ baslik, aciklama }: PanelTopbarProps) {
  const { user } = useAuth()
  const supabase = createClient()
  const [bildirimAcik, setBildirimAcik] = useState(false)
  const [okunmamisVar, setOkunmamisVar] = useState(false)
  const [bildirimler, setBildirimler] = useState<any[]>([])

  const adSoyad: string = user?.user_metadata?.ad_soyad || user?.email || ""
  const galeriAdi: string = user?.user_metadata?.galeri_adi || ""
  const initials = adSoyad
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  // Gerçek zamanlı bildirimleri yükle
  useEffect(() => {
    if (!user) return
    const userId = user.id
    async function loadNotifications() {
      try {
        const { data, error } = await supabase
          .from("bildirimler")
          .select("*")
          .or(`user_id.eq.${userId},user_id.is.null`)
          .order("created_at", { ascending: false })
          .limit(10)
        
        if (error) throw error
        if (data) {
          setBildirimler(data)
          const hasUnread = data.some(b => {
            if (b.user_id) {
              return !b.read
            } else {
              return !b.read_by?.includes(userId)
            }
          })
          setOkunmamisVar(hasUnread)
        }
      } catch (err) {
        console.error("Notifications fetch error:", err)
      }
    }
    
    loadNotifications()

    const channel = supabase
      .channel("realtime-bildirimler")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bildirimler" },
        () => {
          loadNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const handleBildirimTikla = async () => {
    setBildirimAcik(!bildirimAcik)
    if (!bildirimAcik && okunmamisVar && user) {
      setOkunmamisVar(false)
      try {
        const unreadList = bildirimler.filter(b => {
          if (b.user_id) {
            return !b.read
          } else {
            return !b.read_by?.includes(user.id)
          }
        })

        for (const b of unreadList) {
          if (b.user_id) {
            await supabase
              .from("bildirimler")
              .update({ read: true })
              .eq("id", b.id)
          } else {
            const updatedReadBy = [...(b.read_by || []), user.id]
            await supabase
              .from("bildirimler")
              .update({ read_by: updatedReadBy })
              .eq("id", b.id)
          }
        }
      } catch (err) {
        console.error("Error marking notifications as read:", err)
      }
    }
  }

  return (
    <header className="h-16 bg-af-bg/90 backdrop-blur-xl border-b border-af-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Başlık */}
      <div>
        {baslik && <h1 className="text-af-text font-bold text-lg leading-none">{baslik}</h1>}
        {(aciklama || galeriAdi) && (
          <p className="text-af-text-disabled text-xs mt-0.5">
            {galeriAdi ? `Hoş geldiniz, ${galeriAdi}` : aciklama}
          </p>
        )}
      </div>

      {/* Aksiyonlar */}
      <div className="flex items-center gap-3">
        {/* Arama */}
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-af-text-disabled" />
          <input
            type="text"
            placeholder="Araç ara..."
            className="bg-af-surface border border-af-border text-af-text-secondary placeholder:text-af-text-disabled text-sm rounded-xl pl-9 pr-4 py-2 w-48 focus:outline-none focus:border-af-accent focus:w-64 transition-all duration-300"
          />
        </div>

        {/* Hızlı araç ekle */}
        <Link
          href="/panel/araclar/yeni"
          className="flex items-center gap-1.5 bg-af-accent hover:bg-af-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-af-accent/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Araç Ekle</span>
        </Link>

        {/* Bildirim */}
        <div className="relative">
          <button
            onClick={handleBildirimTikla}
            className="relative w-9 h-9 rounded-xl bg-af-surface border border-af-border flex items-center justify-center text-af-text-secondary hover:text-af-text hover:border-af-border-light transition-all focus:outline-none"
          >
            <Bell className="w-4 h-4" />
            {okunmamisVar && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-af-accent rounded-full" />
            )}
          </button>

          {/* Bildirim Dropdown */}
          {bildirimAcik && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBildirimAcik(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-af-surface border border-af-border rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-af-border pb-3 mb-3">
                  <h4 className="font-bold text-af-text text-sm">Bildirimler</h4>
                  {okunmamisVar && (
                    <span className="text-[9px] bg-af-accent/15 text-af-accent border border-af-accent/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Okunmamış</span>
                  )}
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {bildirimler.length === 0 ? (
                    <p className="text-center text-xs text-af-text-disabled py-6">Bildiriminiz bulunmuyor.</p>
                  ) : (
                    bildirimler.map((b) => {
                      const isRead = b.user_id ? b.read : b.read_by?.includes(user?.id)
                      const isGlobal = !b.user_id
                      
                      return (
                        <div 
                          key={b.id} 
                          className={cn(
                            "flex gap-3 p-2.5 rounded-xl hover:bg-af-surface-2/60 transition-colors border border-transparent",
                            !isRead && "bg-af-accent/5 border-af-accent/10"
                          )}
                        >
                          <div className={cn(
                            "w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                            isGlobal ? "text-amber-400 bg-amber-400/10" : "text-af-success bg-af-success/10"
                          )}>
                            {isGlobal ? <Bell className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1.5">
                              <p className="font-bold text-xs text-af-text truncate">{b.title}</p>
                              {isGlobal && (
                                <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1 py-0.5 rounded font-black uppercase flex-shrink-0 leading-none">Genel</span>
                              )}
                            </div>
                            <p className="text-af-text-secondary text-[11px] leading-relaxed mt-0.5 break-words">{b.description}</p>
                            <span className="text-af-text-disabled text-[9px] block mt-1">
                              {new Date(b.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar — ayarlara link */}
        <Link
          href="/panel/ayarlar"
          title="Hesap Ayarları"
          className="w-9 h-9 rounded-xl bg-af-accent flex items-center justify-center text-white text-sm font-black cursor-pointer hover:bg-af-accent-hover transition-colors"
        >
          {initials || "?"}
        </Link>
      </div>
    </header>
  )
}
