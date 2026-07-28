import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PanelSidebar } from "@/components/panel/panel-sidebar"

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/giris")
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PanelSidebar />
      {/* Ana içerik — sidebar kadar offset */}
      <div className="ml-64 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
}

