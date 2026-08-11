import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/admin"
import { HavaleClient } from "./havale-client"
import type { PlanTalebi } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function HavaleTalepleriPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdmin(user.email)) {
    redirect("/panel")
  }

  const { data: requests, error } = await supabase
    .from("plan_talepleri")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    throw new Error(`Havale talepleri yüklenemedi: ${error.message}`)
  }

  const typedRequests = (requests || []) as PlanTalebi[]
  const userIds = [...new Set(typedRequests.map((request) => request.user_id))]
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from("galeri_profilleri")
        .select("user_id, galeri_adi, telefon, plan")
        .in("user_id", userIds)
    : { data: [] }

  const profileMap = Object.fromEntries(
    (profiles || []).map((profile) => [profile.user_id, profile])
  )

  return <HavaleClient initialRequests={typedRequests} profileMap={profileMap} />
}
