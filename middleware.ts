import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Session'ı tazele — bu satır kritik, kaldırma
  const { data: { user } } = await supabase.auth.getUser()

  // Panel rotalarını koru
  if (
    !user &&
    request.nextUrl.pathname.startsWith("/panel")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/giris"
    return NextResponse.redirect(url)
  }

  // Giriş yapmış kullanıcı /giris veya /kayit sayfasına gitmesin
  if (
    user &&
    (request.nextUrl.pathname === "/giris" ||
      request.nextUrl.pathname === "/kayit")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/panel"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/keep-alive|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
