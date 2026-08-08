"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { AfLogo } from "@/components/autoflow/af-logo"
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

export default function SifremiUnuttumPage() {
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState("")
  const [basarili, setBasarili] = useState(false)

  async function handleSifreSifirla(e: React.FormEvent) {
    e.preventDefault()
    setHata("")
    setYukleniyor(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/panel/ayarlar`,
      })

      if (error) {
        throw error
      }

      setBasarili(true)
    } catch (err: any) {
      console.error(err)
      setHata(err.message || "Şifre sıfırlama bağlantısı gönderilemedi. Lütfen tekrar deneyin.")
    } finally {
      setYukleniyor(false)
    }
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
            Şifrenizi güvenle sıfırlayın
          </p>
        </div>

        {/* Kart */}
        <div className="bg-af-surface border border-af-border rounded-2xl p-8 shadow-2xl">
          <Link
            href="/giris"
            className="inline-flex items-center gap-1.5 text-xs text-af-text-secondary hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Giriş Ekranına Dön
          </Link>

          <h1 className="text-2xl font-black text-af-text mb-2">Şifremi Unuttum</h1>
          <p className="text-af-text-secondary text-xs mb-6">
            Hesabınıza kayıtlı e-posta adresinizi girin. Size şifrenizi sıfırlamanız için bir bağlantı göndereceğiz.
          </p>

          {basarili ? (
            <div className="p-6 bg-af-success/10 border border-af-success/25 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-af-success mx-auto" />
              <h2 className="text-lg font-bold text-white">E-posta Gönderildi!</h2>
              <p className="text-af-text-secondary text-xs leading-relaxed">
                <span className="font-semibold text-white">{email}</span> adresine sıfırlama bağlantısı gönderildi. Lütfen gelen kutunuzu ve spam klasörünüzü kontrol edin.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSifreSifirla} className="space-y-4">
              {hata && (
                <div className="flex items-center gap-2.5 bg-af-error/10 border border-af-error/25 rounded-xl px-4 py-3 text-sm text-af-error">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{hata}</p>
                </div>
              )}

              <div>
                <label className="block text-af-text-secondary text-sm font-medium mb-1.5">
                  E-posta Adresiniz
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="galeri@example.com"
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent focus:ring-1 focus:ring-af-accent/30 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={yukleniyor}
                className="w-full bg-af-accent hover:bg-af-accent-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-af-accent/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {yukleniyor ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...
                  </>
                ) : (
                  "Sıfırlama Bağlantısı Gönder"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
