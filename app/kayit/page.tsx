"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { AfLogo } from "@/components/autoflow/af-logo"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  MapPin,
  Phone,
  Clock,
  Upload,
  Trash2,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

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

  const [step, setStep] = useState(1) // 1: Hesap Bilgileri, 2: Galeri Bilgileri
  const [form, setForm] = useState({
    adSoyad: "",
    email: "",
    sifre: "",
    sifreTekrar: "",
    galeriAdi: "",
    galeriAdresi: "",
    telefon: "",
    calismaHaftaIci: "09:00 - 19:00",
    calismaHaftaSonu: "10:00 - 18:00",
    logoUrl: "",
  })

  const [sifreGoster, setSifreGoster] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState("")
  const [basarili, setBasarili] = useState(false)
  const [dogrulamaGerekli, setDogrulamaGerekli] = useState(false)

  const sifreGuclu = form.sifre.length >= 8
  const sifreEslesmiyor = form.sifreTekrar && form.sifre !== form.sifreTekrar

  // Step 1 Validation
  const canGoToStep2 = form.adSoyad && form.email && form.sifre && !sifreEslesmiyor && sifreGuclu

  // Step 2 Validation (Zorunlu alanlar: Galeri Adı, Galeri Adresi, Telefon)
  const canSubmit = form.galeriAdi && form.galeriAdresi && form.telefon

  const compressLogoImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let width = img.width, height = img.height
          const MAX = 400
          if (width > MAX || height > MAX) {
            if (width > height) {
              height = Math.round((height * MAX) / width)
              width = MAX
            } else {
              width = Math.round((width * MAX) / height)
              height = MAX
            }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")!
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.8))
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoUploading(true)
    try {
      const compressedBase64 = await compressLogoImage(file)
      // Varsayılan olarak state'e kaydet (Signup sonrası storage'a da atılabilir, geçici olarak base64 saklanır)
      setForm((prev) => ({ ...prev, logoUrl: compressedBase64 }))
    } catch (err) {
      console.error("Logo sıkıştırma hatası:", err)
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleKayit(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) {
      if (canGoToStep2) setStep(2)
      return
    }

    setHata("")
    setYukleniyor(true)

    const slugBase = galeriSlugOlustur(form.galeriAdi) || "galeri"

    // Profil, auth.users tetikleyicisi tarafından güvenli biçimde oluşturulur.
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.sifre,
      options: {
        emailRedirectTo: `${window.location.origin}/giris?verified=1`,
        data: {
          ad_soyad: form.adSoyad,
          galeri_adi: form.galeriAdi,
          galeri_slug: slugBase,
          adres: form.galeriAdresi,
          telefon: form.telefon,
          calisma_hafta_ici: form.calismaHaftaIci,
          calisma_hafta_sonu: form.calismaHaftaSonu,
        },
      },
    })

    if (error) {
      const mesaj = error.message.includes("already registered")
        ? "Bu e-posta adresi zaten kayıtlı."
        : `Kayıt hatası: ${error.message}`
      setHata(mesaj)
      setYukleniyor(false)
      return
    }

    // E-posta doğrulaması kapalıysa oturum hemen oluşur ve logo yüklenebilir.
    // Doğrulama açıksa logo daha sonra Ayarlar ekranından eklenebilir.
    if (data.user && data.session && form.logoUrl.startsWith("data:")) {
      try {
        const response = await fetch(form.logoUrl)
        const blob = await response.blob()
        const fileName = `${data.user.id}/logos/logo-${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from("araclar")
          .upload(fileName, blob, { contentType: "image/jpeg", upsert: false })

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage.from("araclar").getPublicUrl(fileName)
          await supabase
            .from("galeri_profilleri")
            .update({ logo_url: publicUrl })
            .eq("user_id", data.user.id)
        }
      } catch (logoError) {
        console.warn("Logo kayıt sırasında yüklenemedi:", logoError)
      }
    }

    setDogrulamaGerekli(!data.session)
    setBasarili(true)
    setYukleniyor(false)
    if (data.session) {
      setTimeout(() => { window.location.href = "/panel" }, 2000)
    }
  }

  if (basarili) {
    return (
      <div className="min-h-screen bg-af-bg flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-af-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-af-success" />
          </div>
          <h2 className="text-2xl font-black text-af-text mb-2">Hoş Geldiniz!</h2>
          <p className="text-af-text-secondary text-sm">
            {dogrulamaGerekli
              ? "Hesabınız oluşturuldu. Giriş yapmadan önce e-posta adresinize gönderilen doğrulama bağlantısına tıklayın. Logonuzu giriş yaptıktan sonra Ayarlar ekranından ekleyebilirsiniz."
              : "Hesabınız ve galeriniz başarıyla kuruldu. Panele yönlendiriliyorsunuz..."}
          </p>
          {dogrulamaGerekli && (
            <Link href="/giris" className="mt-6 inline-flex rounded-xl bg-af-accent px-5 py-3 text-sm font-bold text-white">
              Giriş Sayfasına Git
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-af-bg flex items-center justify-center px-5 py-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-af-accent/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <AfLogo variant="full" size={56} />
          </Link>
          <p className="text-af-text-secondary text-sm mt-3">
            Galerinizi dijitalleştirmeye başlayın
          </p>
        </div>

        {/* Kart */}
        <div className="bg-af-surface border border-af-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-black text-af-text">Kayıt Ol</h1>
            <span className="text-xs bg-af-surface-2 border border-af-border px-2.5 py-1 rounded-lg text-af-text-secondary font-semibold">
              Adım {step} / 2
            </span>
          </div>

          <form onSubmit={handleKayit} className="space-y-4">
            {/* STEP 1: Hesap Bilgileri */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Ad Soyad */}
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Ad Soyad
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                    <input
                      required
                      type="text"
                      value={form.adSoyad}
                      onChange={(e) => setForm({ ...form, adSoyad: e.target.value })}
                      placeholder="Ahmet Yılmaz"
                      className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                    />
                  </div>
                </div>

                {/* E-posta */}
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">
                    E-posta
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="galeri@example.com"
                      className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                    />
                  </div>
                </div>

                {/* Şifre */}
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Şifre</span>
                    {form.sifre && (
                      <span className={`text-[10px] font-bold uppercase ${sifreGuclu ? "text-af-success" : "text-af-error"}`}>
                        {sifreGuclu ? "Güçlü ✓" : "En az 8 krkt."}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                    <input
                      required
                      type={sifreGoster ? "text" : "password"}
                      value={form.sifre}
                      onChange={(e) => setForm({ ...form, sifre: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-11 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
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
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Şifre Tekrar
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                    <input
                      required
                      type={sifreGoster ? "text" : "password"}
                      value={form.sifreTekrar}
                      onChange={(e) => setForm({ ...form, sifreTekrar: e.target.value })}
                      placeholder="••••••••"
                      className={cn(
                        "w-full bg-af-surface-2 border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none transition-all",
                        sifreEslesmiyor ? "border-af-error focus:border-af-error" : "border-af-border focus:border-af-accent"
                      )}
                    />
                  </div>
                  {sifreEslesmiyor && (
                    <p className="text-af-error text-xs mt-1.5">Şifreler eşleşmiyor</p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={!canGoToStep2}
                  onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-2 bg-af-accent hover:bg-af-accent-hover disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-af-accent/25 mt-2"
                >
                  Sonraki Adım <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Galeri Bilgileri */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Galeri Adı */}
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Galeri Adı <span className="text-af-accent font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                    <input
                      required
                      type="text"
                      value={form.galeriAdi}
                      onChange={(e) => setForm({ ...form, galeriAdi: e.target.value })}
                      placeholder="Ör: Premium Motors"
                      className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                    />
                  </div>
                </div>

                {/* Telefon Numarası */}
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Telefon Numarası <span className="text-af-accent font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                    <input
                      required
                      type="tel"
                      value={form.telefon}
                      onChange={(e) => setForm({ ...form, telefon: e.target.value })}
                      placeholder="Ör: +90 555 123 45 67"
                      className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                    />
                  </div>
                </div>

                {/* Galeri Adresi */}
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Galeri Adresi <span className="text-af-accent font-bold">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-af-text-disabled" />
                    <textarea
                      required
                      rows={2}
                      value={form.galeriAdresi}
                      onChange={(e) => setForm({ ...form, galeriAdresi: e.target.value })}
                      placeholder="Galeri açık adresi..."
                      className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-2.5 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Çalışma Saatleri (İsteğe Bağlı) */}
                <div className="p-3 bg-af-surface-2/40 border border-af-border rounded-xl space-y-2.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-af-accent" /> Çalışma Saatleri (Opsiyonel)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-af-text-disabled uppercase">Hafta İçi</label>
                      <input
                        type="text"
                        value={form.calismaHaftaIci}
                        onChange={(e) => setForm({ ...form, calismaHaftaIci: e.target.value })}
                        className="w-full bg-af-surface border border-af-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-af-text-disabled uppercase">Hafta Sonu</label>
                      <input
                        type="text"
                        value={form.calismaHaftaSonu}
                        onChange={(e) => setForm({ ...form, calismaHaftaSonu: e.target.value })}
                        className="w-full bg-af-surface border border-af-border rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo Fotoğrafı Ekleme (İsteğe Bağlı) */}
                <div className="p-3 bg-af-surface-2/40 border border-af-border rounded-xl space-y-2.5">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-af-accent" /> Galeri Logosu (Opsiyonel)
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-af-surface border border-af-border overflow-hidden flex items-center justify-center text-af-text-disabled flex-shrink-0 relative">
                      {form.logoUrl ? (
                        <img src={form.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-5 h-5 text-af-text-disabled" />
                      )}
                      {logoUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-af-accent animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        id="register-logo-input"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById("register-logo-input")?.click()}
                          disabled={logoUploading}
                          className="bg-af-surface border border-af-border hover:border-af-accent text-xs font-semibold px-3 py-2 rounded-lg text-white transition-colors"
                        >
                          Logo Seç
                        </button>
                        {form.logoUrl && (
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, logoUrl: "" }))}
                            className="p-2 rounded-lg bg-af-surface text-af-text-disabled hover:text-af-error border border-af-border transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {hata && (
                  <div className="flex items-center gap-2.5 bg-af-error/10 border border-af-error/25 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 text-af-error flex-shrink-0" />
                    <p className="text-af-error text-sm">{hata}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center justify-center p-3 rounded-xl border border-af-border text-af-text-secondary hover:text-white transition-colors"
                    title="Geri Git"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={yukleniyor || !canSubmit}
                    className="flex-1 flex items-center justify-center gap-2 bg-af-accent hover:bg-af-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-af-accent/25"
                  >
                    {yukleniyor ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>Kayıt Ol ve Tamamla <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            )}

            <p className="text-af-text-disabled text-xs text-center leading-relaxed">
              Kayıt olarak{" "}
              <Link href="/gizlilik" className="text-af-text-secondary hover:text-af-text transition-colors">
                Gizlilik Politikası
              </Link>
              &apos;nı kabul etmiş olursunuz.
            </p>
          </form>

          {/* Giriş linki */}
          <p className="text-center text-af-text-secondary text-sm pt-2">
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
