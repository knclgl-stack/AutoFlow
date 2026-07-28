"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Car, Plus, QrCode, BarChart3, Settings, LogOut, Sparkles, CreditCard, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { AfLogo } from "@/components/autoflow/af-logo"
import { useAuth } from "@/lib/auth-context"
import { isAdmin } from "@/lib/admin"
import { createClient } from "@/lib/supabase/client"

const navItems = [
  { href: "/panel", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/panel/araclar", icon: Car, label: "Araçlarım" },
  { href: "/panel/araclar/yeni", icon: Plus, label: "Araç Ekle" },
  { href: "/panel/qr", icon: QrCode, label: "QR Kodlar" },
  { href: "/panel/analitik", icon: BarChart3, label: "Analitik" },
  { href: "/panel/flow-ai", icon: Sparkles, label: "Flow AI" },
  { href: "/panel/abonelik", icon: CreditCard, label: "Abonelik Yönetimi" },
]

export function PanelSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const isActive = (href: string) => href === "/panel" ? pathname === "/panel" : pathname.startsWith(href)

  const [dbPlan, setDbPlan] = useState<string>("Essential")

  useEffect(() => {
    if (!user) return
    const fetchPlan = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("galeri_profilleri")
        .select("plan")
        .eq("user_id", user.id)
        .single()
      if (data && data.plan) {
        setDbPlan(data.plan)
      }
    }
    fetchPlan()
  }, [user])

  const showAdmin = isAdmin(user?.email)

  const galeriAdi: string = user?.user_metadata?.galeri_adi || "Galerim"
  const adSoyad: string = user?.user_metadata?.ad_soyad || user?.email || ""
  const initials = adSoyad
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <aside className="w-64 h-screen bg-af-bg border-r border-af-border flex flex-col fixed left-0 top-0 z-40">
      <div className="px-4 py-3 border-b border-af-border">
        <Link href="/">
          <AfLogo variant="sidebar" size={42} />
        </Link>
      </div>

      <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-af-surface border border-af-border">
        <p className="text-af-text-disabled text-xs mb-0.5">Galeri</p>
        <p className="text-af-text font-semibold text-sm truncate">{galeriAdi}</p>
        <span className={cn(
          "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1.5 border font-semibold",
          dbPlan === "Elite" && "text-af-accent bg-af-accent/10 border-af-accent/20",
          dbPlan === "Professional" && "text-af-info bg-af-info/10 border-af-info/20",
          dbPlan === "Essential" && "text-af-text-secondary bg-af-surface-2 border-af-border"
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            dbPlan === "Elite" && "bg-af-accent",
            dbPlan === "Professional" && "bg-af-info",
            dbPlan === "Essential" && "bg-af-text-disabled"
          )} />
          {dbPlan === "Elite" ? "Elite (Sınırsız)" : dbPlan === "Professional" ? "Professional (10)" : "Essential (Araç Başı)"}
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                active ? "text-white bg-af-accent" : "text-af-text-secondary hover:text-af-text hover:bg-af-surface-2"
              )}
            >
              <item.icon className={cn("w-4 h-4", active ? "text-white" : "text-af-text-disabled")} />
              {item.label}
            </Link>
          )
        })}
        {showAdmin && (
          <Link href="/panel/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive("/panel/admin") ? "text-white bg-af-accent" : "text-af-text-secondary hover:text-af-text hover:bg-af-surface-2"
            )}
          >
            <Shield className={cn("w-4 h-4", isActive("/panel/admin") ? "text-white" : "text-af-text-disabled")} />
            Admin Paneli
          </Link>
        )}
      </nav>

      <div className="p-3 border-t border-af-border space-y-0.5">
        {/* Kullanıcı bilgisi */}
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl bg-af-accent flex items-center justify-center text-white text-xs font-black flex-shrink-0">
            {initials || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-af-text text-xs font-semibold truncate">{adSoyad}</p>
            <p className="text-af-text-disabled text-[10px] truncate">{user?.email}</p>
          </div>
        </div>
        <Link href="/panel/ayarlar" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-af-text-secondary hover:text-af-text hover:bg-af-surface-2 transition-all">
          <Settings className="w-4 h-4" />Ayarlar
        </Link>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-af-text-secondary hover:text-af-error hover:bg-af-error/10 transition-all"
        >
          <LogOut className="w-4 h-4" />Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
