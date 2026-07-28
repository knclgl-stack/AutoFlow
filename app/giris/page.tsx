"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AfLogo } from "@/components/autoflow/af-logo"
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react"

export default function GirisPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [sifre, setSifre] = useState("")
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState("")

  async function handleGiris(e: React.FormEvent) {
    e.preventDefault()
    setHata("")
    setYukleniyor(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: sifre,
    })

    if (error) {
      let mesaj = "Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin."
      if (error.message === "Invalid login credentials") {
        mesaj = "E-posta veya şifre hatalı."
      } else if (error.message.includes("Email not confirmed")) {
        mesaj = "E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzu kontrol edin."
      } else if (error.message.includes("Too many requests")) {
        mesaj = "Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin."
      } else if (error.message.includes("User not found")) {
        mesaj = "Bu e-posta ile kayıtlı bir hesap bulunamadı."
      }
      setHata(mesaj)
      setYukleniyor(false)
      return
    }

    window.location.href = "/panel"
  }

  return (
    <div className="min-h-screen bg-af-bg flex items-center justify-center px-5 relative overflow-hidden">
      {/* Arka plan efektleri */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-af-accent/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <AfLogo variant="full" size={56} />
          </Link>
          <p className="text-af-text-secondary text-sm mt-3">
            Galerinize giriş yapın
          </p>
        </div>

        {/* Kart */}
        <div className="bg-af-surface border border-af-border rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-af-text mb-6">Oturum Aç</h1>

          <form onSubmit={handleGiris} className="space-y-4">
            {/* E-posta */}
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="galeri@example.com"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent focus:ring-1 focus:ring-af-accent/30 transition-all"
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-af-text-secondary text-sm font-medium">
                  Şifre
                </label>
                <Link
                  href="/sifremi-unuttum"
                  className="text-xs text-af-accent hover:text-af-accent-hover transition-colors"
                >
                  Şifremi unuttum
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  id="sifre"
                  type={sifreGoster ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-11 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent focus:ring-1 focus:ring-af-accent/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setSifreGoster(!sifreGoster)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-af-text-disabled hover:text-af-text transition-colors"
                >
                  {sifreGoster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Hata mesajı */}
            {hata && (
              <div className="flex items-center gap-2.5 bg-af-error/10 border border-af-error/25 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-af-error flex-shrink-0" />
                <p className="text-af-error text-sm">{hata}</p>
              </div>
            )}

            {/* Giriş butonu */}
            <button
              id="btn-giris"
              type="submit"
              disabled={yukleniyor}
              className="w-full flex items-center justify-center gap-2 bg-af-accent hover:bg-af-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-xl hover:shadow-af-accent/25 mt-2"
            >
              {yukleniyor ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Giriş Yap <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Kayıt ol linki */}
          <p className="text-center text-af-text-secondary text-sm mt-6">
            Hesabın yok mu?{" "}
            <Link
              href="/kayit"
              className="text-af-accent hover:text-af-accent-hover font-semibold transition-colors"
            >
              Kayıt Ol
            </Link>
          </p>
        </div>

        {/* Demo notu */}
        <p className="text-center text-af-text-disabled text-xs mt-4">
          © 2026 AutoFlow · Araç satış galerilerine özel QR sistemi
        </p>
      </div>
    </div>
  )
}
