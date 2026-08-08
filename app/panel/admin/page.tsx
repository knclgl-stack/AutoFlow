import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"
import { AdminClient } from "./admin-client"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    redirect("/panel")
  }

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

  const scans = (recentScansResult.data || []).map((scan: any) => ({
    ...scan,
    created_at: scan.timestamp || scan.created_at
  }))

  return (
    <AdminClient
      initialGalleries={gResult.data || []}
      initialVehicles={vResult.data || []}
      initialScans={scans}
      totalScansCount={totalCountRes.count || 0}
      mobileScansCount={mobileCountRes.count || 0}
      desktopScansCount={desktopCountRes.count || 0}
      tabletScansCount={tabletCountRes.count || 0}
    />
  )
}
