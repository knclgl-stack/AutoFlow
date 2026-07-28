"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AfLogo } from "@/components/autoflow/af-logo"
import { Eye, EyeOff, Mail, Lock, User, Building2, ArrowRight, AlertCircle, CheckCircle } from "lucide-react"

function galeriSlugOlustur(galeriAdi: string): string {
  return galeriAdi
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function KayitPage() {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    adSoyad: "",
    galeriAdi: "",
    email: "",
    sifre: "",
    sifreTekrar: "",
  })
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState("")
  const [basarili, setBasarili] = useState(false)

  const sifreGuclu = form.sifre.length >= 8
  const sifreEslesmiyor = form.sifreTekrar && form.sifre !== form.sifreTekrar

  async function handleKayit(e: React.FormEvent) {
    e.preventDefault()
    setHata("")

    if (form.sifre !== form.sifreTekrar) {
      setHata("Şifreler eşleşmiyor.")
      return
    }
    if (form.sifre.length < 8) {
      setHata("Şifre en az 8 karakter olmalı.")
      return
    }

    setYukleniyor(true)

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.sifre,
      options: {
        data: {
          ad_soyad: form.adSoyad,
          galeri_adi: form.galeriAdi,
        },
      },
    })

    if (error) {
      const mesaj =
        error.message.includes("already registered")
          ? "Bu e-posta adresi zaten kayıtlı."
          : "Kayıt olurken bir hata oluştu. Lütfen tekrar deneyin."
      setHata(mesaj)
      setYukleniyor(false)
      return
    }

    // Kullanıcı oluştuktan sonra galeri_profilleri tablosuna kaydet
    if (data.user) {
      const slug = galeriSlugOlustur(form.galeriAdi)
      const { error: profileError } = await supabase
        .from("galeri_profilleri")
        .insert({
          user_id: data.user.id,
          galeri_adi: form.galeriAdi,
          slug: slug,
        })
      if (profileError) {
        console.error("Galeri profili oluşturulamadı:", profileError)
      }
    }

    setBasarili(true)
    setYukleniyor(false)

    // Supabase e-posta doğrulama kapalıysa direkt panele yönlendir
    setTimeout(() => { window.location.href = "/panel" }, 2000)
  }

  if (basarili) {
    return (
      <div className="min-h-screen bg-af-bg flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-af-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-af-success" />
          </div>
          <h2 className="text-2xl font-black text-af-text mb-2">Hoş Geldin!</h2>
          <p className="text-af-text-secondary text-sm">
            Hesabın oluşturuldu. Panele yönlendiriliyorsun...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-af-bg flex items-center justify-center px-5 py-10 relative overflow-hidden">
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
            Galerinizi dijitalleştirmeye başlayın
          </p>
        </div>

        {/* Kart */}
        <div className="bg-af-surface border border-af-border rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-black text-af-text mb-6">Kayıt Ol</h1>

          <form onSubmit={handleKayit} className="space-y-4">
            {/* Ad Soyad */}
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">
                Ad Soyad
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  id="adSoyad"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.adSoyad}
                  onChange={(e) => setForm({ ...form, adSoyad: e.target.value })}
                  placeholder="Ahmet Yılmaz"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent focus:ring-1 focus:ring-af-accent/30 transition-all"
                />
              </div>
            </div>

            {/* Galeri Adı */}
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">
                Galeri Adı
              </label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  id="galeriAdi"
                  type="text"
                  required
                  value={form.galeriAdi}
                  onChange={(e) => setForm({ ...form, galeriAdi: e.target.value })}
                  placeholder="Premium Motors İstanbul"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent focus:ring-1 focus:ring-af-accent/30 transition-all"
                />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">
                E-posta
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  id="kayit-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="galeri@example.com"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent focus:ring-1 focus:ring-af-accent/30 transition-all"
                />
              </div>
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">
                Şifre
                {form.sifre && (
                  <span className={`ml-2 text-xs font-normal ${sifreGuclu ? "text-af-success" : "text-af-error"}`}>
                    {sifreGuclu ? "✓ Güçlü" : "En az 8 karakter"}
                  </span>
                )}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  id="kayit-sifre"
                  type={sifreGoster ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={form.sifre}
                  onChange={(e) => setForm({ ...form, sifre: e.target.value })}
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

            {/* Şifre tekrar */}
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">
                Şifre Tekrar
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  id="kayit-sifre-tekrar"
                  type={sifreGoster ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={form.sifreTekrar}
                  onChange={(e) => setForm({ ...form, sifreTekrar: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full bg-af-surface-2 border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none transition-all ${
                    sifreEslesmiyor
                      ? "border-af-error focus:border-af-error focus:ring-1 focus:ring-af-error/30"
                      : "border-af-border focus:border-af-accent focus:ring-1 focus:ring-af-accent/30"
                  }`}
                />
              </div>
              {sifreEslesmiyor && (
                <p className="text-af-error text-xs mt-1.5">Şifreler eşleşmiyor</p>
              )}
            </div>

            {/* Hata mesajı */}
            {hata && (
              <div className="flex items-center gap-2.5 bg-af-error/10 border border-af-error/25 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-af-error flex-shrink-0" />
                <p className="text-af-error text-sm">{hata}</p>
              </div>
            )}

            {/* Kayıt butonu */}
            <button
              id="btn-kayit"
              type="submit"
              disabled={yukleniyor || !!sifreEslesmiyor}
              className="w-full flex items-center justify-center gap-2 bg-af-accent hover:bg-af-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-xl hover:shadow-af-accent/25 mt-2"
            >
              {yukleniyor ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Hesap Oluştur <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-af-text-disabled text-xs text-center leading-relaxed">
              Kayıt olarak{" "}
              <Link href="/gizlilik" className="text-af-text-secondary hover:text-af-text transition-colors">
                Gizlilik Politikası
              </Link>
              &apos;nı kabul etmiş olursunuz.
            </p>
          </form>

          {/* Giriş linki */}
          <p className="text-center text-af-text-secondary text-sm mt-6">
            Zaten hesabın var mı?{" "}
            <Link
              href="/giris"
              className="text-af-accent hover:text-af-accent-hover font-semibold transition-colors"
            >
              Oturum Aç
            </Link>
          </p>
        </div>

        <p className="text-center text-af-text-disabled text-xs mt-4">
          © 2026 AutoFlow · Araç satış galerilerine özel QR sistemi
        </p>
      </div>
    </div>
  )
}
