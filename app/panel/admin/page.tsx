"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { isAdmin } from "@/lib/admin"
import { createClient } from "@/lib/supabase/client"
import { AdminClient } from "./admin-client"

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [galleries, setGalleries] = useState<any[]>([])
  const [vehicles, setVehicles] = useState<any[]>([])
  const [scans, setScans] = useState<any[]>([])
  const [totalScansCount, setTotalScansCount] = useState(0)
  const [mobileScansCount, setMobileScansCount] = useState(0)
  const [desktopScansCount, setDesktopScansCount] = useState(0)
  const [tabletScansCount, setTabletScansCount] = useState(0)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user || !isAdmin(user.email)) {
      router.push("/panel")
      return
    }

    async function fetchAdminData() {
      try {
        const [
          gResult,
          vResult,
          recentScansResult,
          totalCountRes,
          mobileCountRes,
          desktopCountRes,
          tabletCountRes
        ] = await Promise.all([
          supabase
            .from("galeri_profilleri")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("araclar")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("qr_events")
            .select("device_type, timestamp")
            .order("timestamp", { ascending: false })
            .limit(50),
          supabase
            .from("qr_events")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("qr_events")
            .select("*", { count: "exact", head: true })
            .eq("device_type", "mobile"),
          supabase
            .from("qr_events")
            .select("*", { count: "exact", head: true })
            .eq("device_type", "desktop"),
          supabase
            .from("qr_events")
            .select("*", { count: "exact", head: true })
            .eq("device_type", "tablet")
        ])
        
        const mappedScans = (recentScansResult.data || []).map((scan: any) => ({
          ...scan,
          created_at: scan.timestamp || scan.created_at
        }))

        if (gResult.data) setGalleries(gResult.data)
        if (vResult.data) setVehicles(vResult.data)
        if (recentScansResult.data) setScans(mappedScans)
        
        setTotalScansCount(totalCountRes.count || 0)
        setMobileScansCount(mobileCountRes.count || 0)
        setDesktopScansCount(desktopCountRes.count || 0)
        setTabletScansCount(tabletCountRes.count || 0)
      } catch (err) {
        console.error("Yönetici paneli veri çekme hatası:", err)
      } finally {
        setDataLoading(false)
      }
    }

    fetchAdminData()
  }, [user, authLoading, router, supabase])

  if (authLoading || (!user || !isAdmin(user.email)) || dataLoading) {
    return (
      <div className="min-h-screen bg-af-bg flex items-center justify-center">
        <div className="text-center">
          <span className="w-10 h-10 border-4 border-af-accent/30 border-t-af-accent rounded-full animate-spin block mx-auto mb-4" />
          <p className="text-af-text-secondary text-sm">Yönetici Paneli Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <AdminClient 
      initialGalleries={galleries} 
      initialVehicles={vehicles} 
      initialScans={scans} 
      totalScansCount={totalScansCount}
      mobileScansCount={mobileScansCount}
      desktopScansCount={desktopScansCount}
      tabletScansCount={tabletScansCount}
    />
  )
}
