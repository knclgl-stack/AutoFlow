import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Veritabanını uyanık tutmak için minimal bir sorgu
    const { error } = await supabase.from("galeri_profilleri_public").select("user_id").limit(1)
    if (error) throw error

    return NextResponse.json({ ok: true, ts: new Date().toISOString() })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
