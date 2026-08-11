import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { PanelSidebar } from "@/components/panel/panel-sidebar"

export const metadata: Metadata = {
  title: "Yönetim Paneli",
  robots: { index: false, follow: false },
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/giris")
  }

  return (
    <div className="min-h-screen bg-af-bg text-af-text">
      <PanelSidebar />
      {/* Ana içerik — masaüstünde sidebar kadar offset, mobilde sıfır offset */}
      <div className="ml-0 lg:ml-64 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
}
