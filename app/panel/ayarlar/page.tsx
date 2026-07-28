"use client"

import { useEffect, useState } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  User,
  Building2,
  Lock,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Clock,
  Globe,
  Instagram,
  Image,
} from "lucide-react"

function galeriSlugOlustur(galeriAdi: string): string {
  return galeriAdi
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export default function AyarlarPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  const [profil, setProfil] = useState({
    adSoyad: "",
    galeriAdi: "",
    logoUrl: "",
    telefon: "",
    whatsapp: "",
    instagram: "",
    website: "",
    adres: "",
    sehir: "",
    calismaHaftaIci: "09:00 - 19:00",
    calismaHaftaSonu: "10:00 - 18:00",
  })

  const [profilYukleniyor, setProfilYukleniyor] = useState(false)
  const [veriYukleniyor, setVeriYukleniyor] = useState(true)
  const [profilMesaj, setProfilMesaj] = useState<{ tip: "basarili" | "hata"; metin: string } | null>(null)

  const [sifre, setSifre] = useState({ yeni: "", tekrar: "" })
  const [sifreGoster, setSifreGoster] = useState(false)
  const [sifreYukleniyor, setSifreYukleniyor] = useState(false)
  const [sifreMesaj, setSifreMesaj] = useState<{ tip: "basarili" | "hata"; metin: string } | null>(null)

  useEffect(() => {
    if (!user) return

    async function profilYukle() {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from("galeri_profilleri")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (data && !error) {
          setProfil({
            adSoyad: user.user_metadata?.ad_soyad || "",
            galeriAdi: data.galeri_adi || "",
            logoUrl: data.logo_url || "",
            telefon: data.telefon || "",
            whatsapp: data.whatsapp || "",
            instagram: data.instagram || "",
            website: data.website || "",
            adres: data.adres || "",
            sehir: data.sehir || "",
            calismaHaftaIci: data.calisma_saatleri?.hafta_ici || "09:00 - 19:00",
            calismaHaftaSonu: data.calisma_saatleri?.hafta_sonu || "10:00 - 18:00",
          })
        } else {
          setProfil((prev) => ({
            ...prev,
            adSoyad: user.user_metadata?.ad_soyad || "",
            galeriAdi: user.user_metadata?.galeri_adi || "",
          }))
        }
      } catch (err) {
        console.error("Profil verisi çekilemedi:", err)
      } finally {
        setVeriYukleniyor(false)
      }
    }

    profilYukle()
  }, [user])

  async function handleProfilKaydet(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    setProfilYukleniyor(true)
    setProfilMesaj(null)

    // 1. Auth metadata güncelle
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        ad_soyad: profil.adSoyad,
        galeri_adi: profil.galeriAdi,
      },
    })

    if (authError) {
      setProfilYukleniyor(false)
      setProfilMesaj({ tip: "hata", metin: "Kullanıcı bilgileri güncellenemedi." })
      return
    }

    // 2. galeri_profilleri tablosunu güncelle/oluştur (upsert)
    const slug = galeriSlugOlustur(profil.galeriAdi)
    const { error: profileError } = await supabase
      .from("galeri_profilleri")
      .upsert({
        user_id: user.id,
        galeri_adi: profil.galeriAdi,
        slug: slug,
        telefon: profil.telefon,
        whatsapp: profil.whatsapp,
        instagram: profil.instagram,
        website: profil.website,
        adres: profil.adres,
        sehir: profil.sehir,
        calisma_saatleri: {
          hafta_ici: profil.calismaHaftaIci,
          hafta_sonu: profil.calismaHaftaSonu,
        },
      })

    setProfilYukleniyor(false)
    if (profileError) {
      console.error(profileError)
      setProfilMesaj({ tip: "hata", metin: "Galeri profili güncellenirken hata oluştu." })
    } else {
      setProfilMesaj({ tip: "basarili", metin: "Profil ve galeri bilgileriniz başarıyla güncellendi." })
      // Slug değiştiğinde yönlendirmeler ve header'daki isimler güncellensin diye sayfayı yenileyelim
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  async function handleSifreDegistir(e: React.FormEvent) {
    e.preventDefault()
    setSifreMesaj(null)

    if (sifre.yeni !== sifre.tekrar) {
      setSifreMesaj({ tip: "hata", metin: "Şifreler eşleşmiyor." })
      return
    }
    if (sifre.yeni.length < 8) {
      setSifreMesaj({ tip: "hata", metin: "Şifre en az 8 karakter olmalı." })
      return
    }

    setSifreYukleniyor(true)
    const { error } = await supabase.auth.updateUser({ password: sifre.yeni })
    setSifreYukleniyor(false)

    if (error) {
      setSifreMesaj({ tip: "hata", metin: "Şifre değiştirilemedi. Lütfen tekrar deneyin." })
    } else {
      setSifreMesaj({ tip: "basarili", metin: "Şifreniz başarıyla güncellendi." })
      setSifre({ yeni: "", tekrar: "" })
    }
  }

  if (veriYukleniyor) {
    return (
      <div className="flex flex-col min-h-screen bg-af-bg">
        <PanelTopbar baslik="Hesap Ayarları" />
        <main className="flex-1 p-6 flex justify-center items-center">
          <span className="w-10 h-10 border-4 border-af-accent/30 border-t-af-accent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-af-bg">
      <PanelTopbar baslik="Hesap Ayarları" aciklama="Profil ve güvenlik bilgilerinizi yönetin" />
      <main className="flex-1 p-6 max-w-3xl space-y-6">

        {/* E-posta (salt okunur) */}
        <div className="bg-af-surface border border-af-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-af-accent" />
            <h2 className="font-bold text-af-text">E-posta Adresi</h2>
          </div>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text-disabled text-sm cursor-not-allowed opacity-70"
            />
          </div>
          <p className="text-af-text-disabled text-xs mt-2">E-posta adresinizi değiştiremezsiniz.</p>
        </div>

        {/* Profil ve Galeri Bilgileri */}
        <form onSubmit={handleProfilKaydet} className="bg-af-surface border border-af-border rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-af-accent" />
            <h2 className="font-bold text-af-text">Profil ve Galeri Bilgileri</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ad Soyad */}
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Ad Soyad</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  type="text"
                  required
                  value={profil.adSoyad}
                  onChange={(e) => setProfil({ ...profil, adSoyad: e.target.value })}
                  placeholder="Ahmet Yılmaz"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                />
              </div>
            </div>

            {/* Galeri Adı */}
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Galeri Adı</label>
              <div className="relative">
                <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  type="text"
                  required
                  value={profil.galeriAdi}
                  onChange={(e) => setProfil({ ...profil, galeriAdi: e.target.value })}
                  placeholder="Premium Motors İstanbul"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Profil Resmi / Logo (Veritabanında logo_url kolonu olmadığı için devre dışı bırakıldı) */}
            {/*
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Galeri Profil Görseli URL</label>
              <div className="relative">
                <Image className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  type="text"
                  value={profil.logoUrl}
                  onChange={(e) => setProfil({ ...profil, logoUrl: e.target.value })}
                  placeholder="https://... (Fotoğraf URL)"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                />
              </div>
            </div>
            */}

            {/* Telefon */}
            <div className="md:col-span-2">
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Telefon Numarası</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  type="text"
                  value={profil.telefon}
                  onChange={(e) => setProfil({ ...profil, telefon: e.target.value })}
                  placeholder="+90 212 555 01 01"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Adres ve Şehir */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">İşyeri Adresi</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  type="text"
                  value={profil.adres}
                  onChange={(e) => setProfil({ ...profil, adres: e.target.value })}
                  placeholder="Atatürk Mah. Fatih Cad. No:12"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Şehir</label>
              <input
                type="text"
                value={profil.sehir}
                onChange={(e) => setProfil({ ...profil, sehir: e.target.value })}
                placeholder="İstanbul"
                className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
              />
            </div>
          </div>

          {/* Çalışma Saatleri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-af-border/60 pt-4">
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Hafta İçi Çalışma Saatleri</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  type="text"
                  value={profil.calismaHaftaIci}
                  onChange={(e) => setProfil({ ...profil, calismaHaftaIci: e.target.value })}
                  placeholder="09:00 - 19:00"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Hafta Sonu Çalışma Saatleri</label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  type="text"
                  value={profil.calismaHaftaSonu}
                  onChange={(e) => setProfil({ ...profil, calismaHaftaSonu: e.target.value })}
                  placeholder="10:00 - 18:00"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                />
              </div>
            </div>
          </div>

          {/* Sosyal Medya ve İletişim */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-af-border/60 pt-4">
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Instagram (Kullanıcı Adı)</label>
              <div className="relative">
                <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  type="text"
                  value={profil.instagram}
                  onChange={(e) => setProfil({ ...profil, instagram: e.target.value })}
                  placeholder="galeri_adi"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">WhatsApp Linki</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  type="text"
                  value={profil.whatsapp}
                  onChange={(e) => setProfil({ ...profil, whatsapp: e.target.value })}
                  placeholder="+90555..."
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Web Sitesi URL</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
                <input
                  type="text"
                  value={profil.website}
                  onChange={(e) => setProfil({ ...profil, website: e.target.value })}
                  placeholder="www.galeri.com"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none focus:border-af-accent transition-all"
                />
              </div>
            </div>
          </div>

          {profilMesaj && (
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm ${
              profilMesaj.tip === "basarili"
                ? "bg-af-success/10 border-af-success/25 text-af-success"
                : "bg-af-error/10 border-af-error/25 text-af-error"
            }`}>
              {profilMesaj.tip === "basarili"
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" />
              }
              {profilMesaj.metin}
            </div>
          )}

          <button
            type="submit"
            disabled={profilYukleniyor}
            className="flex items-center gap-2 bg-af-accent hover:bg-af-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-af-accent/25 text-sm"
          >
            {profilYukleniyor
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Save className="w-4 h-4" />
            }
            Değişiklikleri Kaydet
          </button>
        </form>

        {/* Şifre değiştir */}
        <form onSubmit={handleSifreDegistir} className="bg-af-surface border border-af-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-af-accent" />
            <h2 className="font-bold text-af-text">Şifre Değiştir</h2>
          </div>

          <div>
            <label className="block text-af-text-secondary text-sm font-medium mb-1.5">
              Yeni Şifre
              {sifre.yeni && (
                <span className={`ml-2 text-xs font-normal ${sifre.yeni.length >= 8 ? "text-af-success" : "text-af-error"}`}>
                  {sifre.yeni.length >= 8 ? "✓ Güçlü" : "En az 8 karakter"}
                </span>
              )}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
              <input
                type={sifreGoster ? "text" : "password"}
                value={sifre.yeni}
                onChange={(e) => setSifre({ ...sifre, yeni: e.target.value })}
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

          <div>
            <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Yeni Şifre Tekrar</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-af-text-disabled" />
              <input
                type={sifreGoster ? "text" : "password"}
                value={sifre.tekrar}
                onChange={(e) => setSifre({ ...sifre, tekrar: e.target.value })}
                placeholder="••••••••"
                className={`w-full bg-af-surface-2 border rounded-xl pl-10 pr-4 py-3 text-af-text placeholder:text-af-text-disabled text-sm focus:outline-none transition-all ${
                  sifre.tekrar && sifre.yeni !== sifre.tekrar
                    ? "border-af-error focus:border-af-error focus:ring-1 focus:ring-af-error/30"
                    : "border-af-border focus:border-af-accent focus:ring-1 focus:ring-af-accent/30"
                }`}
              />
            </div>
            {sifre.tekrar && sifre.yeni !== sifre.tekrar && (
              <p className="text-af-error text-xs mt-1.5">Şifreler eşleşmiyor</p>
            )}
          </div>

          {sifreMesaj && (
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm ${
              sifreMesaj.tip === "basarili"
                ? "bg-af-success/10 border-af-success/25 text-af-success"
                : "bg-af-error/10 border-af-error/25 text-af-error"
            }`}>
              {sifreMesaj.tip === "basarili"
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0" />
              }
              {sifreMesaj.metin}
            </div>
          )}

          <button
            type="submit"
            disabled={sifreYukleniyor || !sifre.yeni}
            className="flex items-center gap-2 bg-af-accent hover:bg-af-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-af-accent/25 text-sm"
          >
            {sifreYukleniyor
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Lock className="w-4 h-4" />
            }
            Şifreyi Güncelle
          </button>
        </form>

      </main>
    </div>
  )
}
