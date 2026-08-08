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
  Image as ImageIcon,
  Upload,
  Camera,
  Trash2,
  Loader2
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
    slug: "",
    plan: "Essential",
  })

  const [profilYukleniyor, setProfilYukleniyor] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
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
            slug: data.slug || "",
            plan: data.plan || "Essential",
          })
        } else {
          setProfil((prev) => ({
            ...prev,
            adSoyad: user.user_metadata?.ad_soyad || "",
            galeriAdi: user.user_metadata?.galeri_adi || "",
            slug: galeriSlugOlustur(user.user_metadata?.galeri_adi || ""),
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
    if (!file || !user) return

    setLogoUploading(true)
    try {
      const compressedBase64 = await compressLogoImage(file)
      
      let uploadedUrl: string | null = null
      try {
        const fileName = `${user.id}/logo-${Date.now()}.jpg`
        // Data URL'den Blob oluştur
        const res = await fetch(compressedBase64)
        const blob = await res.blob()

        const { error: uploadErr } = await supabase.storage
          .from("araclar")
          .upload(fileName, blob, { contentType: "image/jpeg", upsert: true })
        
        if (!uploadErr) {
          const { data: { publicUrl } } = supabase.storage
            .from("araclar")
            .getPublicUrl(fileName)
          uploadedUrl = publicUrl
        }
      } catch (err) {
        console.warn("Storage upload fallback to base64", err)
      }

      const finalUrl = uploadedUrl || compressedBase64
      setProfil((prev) => ({ ...prev, logoUrl: finalUrl }))
    } catch (err) {
      console.error("Logo işleme hatası:", err)
    } finally {
      setLogoUploading(false)
    }
  }

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
      setProfilMesaj({ tip: "hata", metin: "Kullanıcı bilgileri güncellenemedi: " + authError.message })
      return
    }

    // 2. galeri_profilleri tablosunu güncelle/oluştur (upsert)
    const isPremium = profil.plan === "Elite" || profil.plan === "Professional"
    let finalSlug = ""
    if (isPremium) {
      finalSlug = profil.slug ? galeriSlugOlustur(profil.slug) : galeriSlugOlustur(profil.galeriAdi)
    } else {
      finalSlug = profil.slug && profil.slug.startsWith("galeri-") 
        ? profil.slug 
        : `galeri-${Math.random().toString(36).substring(2, 8)}`
    }

    const { error: profileError } = await supabase
      .from("galeri_profilleri")
      .upsert({
        user_id: user.id,
        galeri_adi: profil.galeriAdi,
        logo_url: profil.logoUrl,
        slug: finalSlug,
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
      }, { onConflict: "user_id" })

    setProfilYukleniyor(false)
    if (profileError) {
      console.error("Profile error:", profileError)
      let metin = profileError.message || "Galeri profili güncellenirken hata oluştu."
      if (profileError.message?.includes("duplicate key") || profileError.code === "23505") {
        metin = "Bu sayfa adresi (slug) başka bir galeri tarafından kullanılıyor. Lütfen farklı bir adres girin."
      }
      setProfilMesaj({ tip: "hata", metin })
    } else {
      setProfilMesaj({ tip: "basarili", metin: "Profil ve galeri bilgileriniz başarıyla güncellendi." })
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

          {/* Galeri Logosu / Profil Fotoğrafı */}
          <div className="p-4 bg-af-surface-2/40 border border-af-border rounded-xl space-y-3">
            <label className="block text-af-text-secondary text-sm font-medium">Galeri Logosu / Profil Fotoğrafı</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-af-surface border border-af-border overflow-hidden flex items-center justify-center text-af-text-disabled flex-shrink-0 relative group">
                {profil.logoUrl ? (
                  <img src={profil.logoUrl} alt="Galeri Logosu" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-af-text-disabled" />
                )}
                {logoUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-af-accent animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <input
                  id="logo-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => document.getElementById("logo-file-input")?.click()}
                    disabled={logoUploading}
                    className="flex items-center gap-2 bg-af-accent hover:bg-af-accent-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-af-accent/15 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" /> Logo Yükle
                  </button>
                  {profil.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setProfil((prev) => ({ ...prev, logoUrl: "" }))}
                      className="p-2.5 rounded-xl bg-af-surface hover:bg-af-error/10 text-af-text-disabled hover:text-af-error border border-af-border transition-colors"
                      title="Logoyu Kaldır"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-af-text-disabled">PNG veya JPG formatında logo veya profil görseliniz</p>
              </div>
            </div>
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

          {/* Özel Slug (Alan adı) Seçimi */}
          <div className="border-t border-af-border/60 pt-4">
            <label className="block text-af-text-secondary text-sm font-medium mb-1.5 flex items-center justify-between">
              <span>Galeri Sayfa Adresi (Slug)</span>
              {profil.plan !== "Elite" && profil.plan !== "Professional" ? (
                <span className="text-[10px] bg-af-accent/10 text-af-accent border border-af-accent/20 px-2.5 py-0.5 rounded-full font-bold">
                  Professional & Elite Özelliği
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">
                  Özel Slug Aktif
                </span>
              )}
            </label>
            <div className="flex rounded-xl bg-af-surface-2 border border-af-border overflow-hidden">
              <span className="flex items-center px-3.5 text-xs text-af-text-disabled bg-af-bg border-r border-af-border select-none">
                autoflow.com.tr/galeri/
              </span>
              <input
                type="text"
                value={profil.slug}
                disabled={profil.plan !== "Elite" && profil.plan !== "Professional"}
                onChange={(e) => setProfil({ ...profil, slug: e.target.value })}
                placeholder="galeri-adiniz"
                className="flex-1 bg-transparent px-4 py-3 text-af-text disabled:text-af-text-disabled placeholder:text-af-text-disabled text-sm focus:outline-none disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-af-text-disabled text-xs mt-1.5">
              {profil.plan !== "Elite" && profil.plan !== "Professional" 
                ? "Mevcut ücretsiz planınızda sayfa adresi galeri isminden otomatik oluşturulur." 
                : "Sayfa adresinizde Türkçe karakter kullanılamaz, kelimeler tire (-) ile ayrılır."
              }
            </p>
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
