import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/admin"
import { AdminClient } from "./admin-client"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = await createClient()
  
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (e) {
    console.error("Yönetici kontrolünde yetki hatası:", e)
  }

  if (!user || !isAdmin(user.email)) {
    redirect("/panel")
  }

  let galleries: any[] = []
  let vehicles: any[] = []
  let scans: any[] = []

  try {
    // Tüm galerileri getir
    const { data: gData, error: gErr } = await supabase
      .from("galeri_profilleri")
      .select("*")
      .order("created_at", { ascending: false })
    
    if (gErr) console.warn("Galeriler çekilirken hata oluştu (RLS veya bağlantı):", gErr.message)
    else if (gData) galleries = gData

    // Tüm araçları getir
    const { data: vData, error: vErr } = await supabase
      .from("araclar")
      .select("*")
      .order("created_at", { ascending: false })

    if (vErr) console.warn("Araçlar çekilirken hata oluştu (RLS veya bağlantı):", vErr.message)
    else if (vData) vehicles = vData

    // Tüm QR okutma verilerini getir
    const { data: sData, error: sErr } = await supabase
      .from("qr_events")
      .select("*")
      .order("timestamp", { ascending: false })

    if (sErr) console.warn("QR okuma verileri çekilirken hata oluştu (RLS veya bağlantı):", sErr.message)
    else if (sData) scans = sData

  } catch (err) {
    console.error("Yönetici paneli veritabanı sorgu hatası:", err)
  }

  return (
    <AdminClient 
      initialGalleries={galleries} 
      initialVehicles={vehicles} 
      initialScans={scans} 
    />
  )
}
