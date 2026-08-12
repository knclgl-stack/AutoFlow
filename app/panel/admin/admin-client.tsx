"use client"

import { useState } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import { createClient } from "@/lib/supabase/client"
import { 
  Users, 
  Car, 
  QrCode, 
  Search, 
  Trash2, 
  ExternalLink, 
  Activity, 
  Shield, 
  Sparkles, 
  AlertCircle,
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  X,
  Edit2,
  Upload,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Bell,
  Send
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminClientProps {
  initialGalleries: any[]
  initialVehicles: any[]
  initialScans: any[]
  totalScansCount: number
  mobileScansCount: number
  desktopScansCount: number
  tabletScansCount: number
}

const VITESLER = ["Manuel", "Otomatik", "Yarı-Otomatik"]
const YAKITLAR = ["Benzin", "Dizel", "Elektrik", "Hybrid", "LPG"]
const KASALAR = ["Sedan", "Hatchback", "SUV", "Coupe", "Pickup", "Cabrio", "Station Wagon", "Minivan"]

const inputClass = "w-full bg-af-surface border border-af-border text-af-text placeholder:text-af-text-disabled rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-af-accent transition-colors"

export function AdminClient({ 
  initialGalleries, 
  initialVehicles, 
  initialScans,
  totalScansCount,
  mobileScansCount,
  desktopScansCount,
  tabletScansCount
}: AdminClientProps) {
  const supabase = createClient()
  const [aktifTab, setAktifTab] = useState<"stats" | "galleries" | "vehicles" | "subscriptions" | "notifications">("stats")

  // Notification State Variables
  const [notifTarget, setNotifTarget] = useState<"all" | "single">("all")
  const [notifUserId, setNotifUserId] = useState<string>("")
  const [notifTitle, setNotifTitle] = useState("")
  const [notifDesc, setNotifDesc] = useState("")
  const [notifSending, setNotifSending] = useState(false)

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle.trim() || !notifDesc.trim()) return

    setNotifSending(true)
    setMesaj(null)

    try {
      const payload = {
        user_id: notifTarget === "single" ? notifUserId : null,
        title: notifTitle,
        description: notifDesc,
        read: false,
        read_by: []
      }

      const { error } = await supabase
        .from("bildirimler")
        .insert(payload)

      if (error) throw error

      setMesaj({ tip: "basarili", metin: "Bildirim başarıyla gönderildi! 🎉" })
      setNotifTitle("")
      setNotifDesc("")
    } catch (err: any) {
      console.error("Error sending notification:", err)
      setMesaj({ tip: "hata", metin: `Bildirim gönderilemedi: ${err.message || err}` })
    } finally {
      setNotifSending(false)
    }
  }
  
  const [galleries, setGalleries] = useState(initialGalleries)
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [scans] = useState(initialScans)

  const [galeriArama, setGaleriArama] = useState("")
  const [aracArama, setAracArama] = useState("")
  const [aracDurumFiltre, setAracDurumFiltre] = useState("Hepsi")

  const [islemde, setIslemde] = useState<string | null>(null)
  const [mesaj, setMesaj] = useState<{ tip: "basarili" | "hata"; metin: string } | null>(null)

  // Düzenleme State'leri
  const [duzenlenenGaleri, setDuzenlenenGaleri] = useState<any | null>(null)
  const [duzenlenenArac, setDuzenlenenArac] = useState<any | null>(null)
  const [duzenlemeKaydediliyor, setDuzenlemeKaydediliyor] = useState(false)

  // Admin araç fotoğraf yönetimi state'leri ve fonksiyonları
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file")
  const [yeniFotoUrl, setYeniFotoUrl] = useState("")
  const [uploading, setUploading] = useState(false)

  // Galeri logo yükleme state'leri
  const [logoUploadMode, setLogoUploadMode] = useState<"file" | "url">("file")
  const [logoUrlInput, setLogoUrlInput] = useState("")
  const [logoUploading, setLogoUploading] = useState(false)

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let width = img.width
          let height = img.height
          const MAX_W = 1200
          const MAX_H = 900
          if (width > height) {
            if (width > MAX_W) { height *= MAX_W / width; width = MAX_W }
          } else {
            if (height > MAX_H) { width *= MAX_H / height; height = MAX_H }
          }
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")!
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/jpeg", 0.75))
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(",")
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg"
    const bstr = atob(arr[arr.length - 1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) { u8arr[n] = bstr.charCodeAt(n) }
    return new Blob([u8arr], { type: mime })
  }

  const uploadToSupabase = async (file: File, userId: string): Promise<string> => {
    const fileExt = "jpg"
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from("araclar")
      .upload(fileName, file, { 
        contentType: "image/jpeg",
        cacheControl: '31536000'
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from("araclar")
      .getPublicUrl(fileName)

    return publicUrl
  }

  const uploadGalleryLogo = async (file: File, userId: string): Promise<string> => {
    const fileExt = "jpg"
    const fileName = `logos/${userId}/${Date.now()}.${fileExt}`
    // Önce "araclar" bucket'ına dene, yoksa aynı bucket'ta logo klasörü kullan
    const { error: uploadError } = await supabase.storage
      .from("araclar")
      .upload(fileName, file, { 
        contentType: "image/jpeg", 
        upsert: true,
        cacheControl: '31536000'
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from("araclar")
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!duzenlenenGaleri || !e.target.files || e.target.files.length === 0) return
    setLogoUploading(true)
    const file = e.target.files[0]
    try {
      const compressedBase64 = await compressImage(file)
      const blob = dataURLtoBlob(compressedBase64)
      const compressedFile = new File([blob], file.name, { type: "image/jpeg" })
      const uploadedUrl = await uploadGalleryLogo(compressedFile, duzenlenenGaleri.user_id)
      setDuzenlenenGaleri({ ...duzenlenenGaleri, logo_url: uploadedUrl })
    } catch (err) {
      console.error(err)
      alert("Logo yüklenirken hata oluştu.")
    } finally {
      setLogoUploading(false)
      e.target.value = ""
    }
  }

  const handleAdminFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!duzenlenenArac || !e.target.files || e.target.files.length === 0) return
    setUploading(true)
    const files = e.target.files
    const newUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const compressedBase64 = await compressImage(file)
        
        const blob = dataURLtoBlob(compressedBase64)
        const compressedFile = new File([blob], file.name, { type: "image/jpeg" })
        const uploadedUrl = await uploadToSupabase(compressedFile, duzenlenenArac.user_id)
        newUrls.push(uploadedUrl)
      }
      
      const currentFotos = duzenlenenArac.fotograflar || []
      setDuzenlenenArac({
        ...duzenlenenArac,
        fotograflar: [...currentFotos, ...newUrls]
      })
    } catch (err) {
      console.error(err)
      alert("Görseller yüklenirken hata oluştu.")
    } finally {
      setUploading(false)
    }
  }

  const addAdminFotoUrl = () => {
    if (!duzenlenenArac) return
    if (yeniFotoUrl.trim() && yeniFotoUrl.startsWith("http")) {
      const currentFotos = duzenlenenArac.fotograflar || []
      setDuzenlenenArac({
        ...duzenlenenArac,
        fotograflar: [...currentFotos, yeniFotoUrl.trim()]
      })
      setYeniFotoUrl("")
    }
  }

  const removeAdminFoto = (index: number) => {
    if (!duzenlenenArac) return
    const currentFotos = duzenlenenArac.fotograflar || []
    setDuzenlenenArac({
      ...duzenlenenArac,
      fotograflar: currentFotos.filter((_: any, i: number) => i !== index)
    })
  }

  const makeAdminCover = (index: number) => {
    if (!duzenlenenArac || index === 0) return
    const currentFotos = [...(duzenlenenArac.fotograflar || [])]
    const [target] = currentFotos.splice(index, 1)
    currentFotos.unshift(target)
    setDuzenlenenArac({
      ...duzenlenenArac,
      fotograflar: currentFotos
    })
  }

  const moveAdminFoto = (index: number, direction: "left" | "right") => {
    if (!duzenlenenArac) return
    const currentFotos = [...(duzenlenenArac.fotograflar || [])]
    const targetIndex = direction === "left" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= currentFotos.length) return
    const temp = currentFotos[index]
    currentFotos[index] = currentFotos[targetIndex]
    currentFotos[targetIndex] = temp
    setDuzenlenenArac({
      ...duzenlenenArac,
      fotograflar: currentFotos
    })
  }

  // İstatistikler
  const totalGalleries = galleries.length
  const totalVehicles = vehicles.length
  const totalScans = totalScansCount
  const activeVehicles = vehicles.filter(v => v.durum === "Aktif").length
  const soldVehicles = vehicles.filter(v => v.durum === "Satildi").length

  // Cihaz Dağılımı
  const mobileScans = mobileScansCount
  const desktopScans = desktopScansCount
  const tabletScans = tabletScansCount

  const getVehicleCount = (userId: string) => {
    return vehicles.filter(v => v.user_id === userId).length
  }

  const getGalleryName = (userId: string) => {
    const gal = galleries.find(g => g.user_id === userId)
    return gal ? gal.galeri_adi : "Bilinmeyen Galeri"
  }

  // Slug Oluşturucu Helper
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }

  // Galeri Düzenleme Kaydet
  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!duzenlenenGaleri) return

    setDuzenlemeKaydediliyor(true)
    setMesaj(null)

    const updatedSlug = generateSlug(duzenlenenGaleri.galeri_adi)

    try {
      const { data, error } = await supabase
        .from("galeri_profilleri")
        .update({
          galeri_adi: duzenlenenGaleri.galeri_adi,
          slug: updatedSlug,
          telefon: duzenlenenGaleri.telefon,
          whatsapp: duzenlenenGaleri.whatsapp,
          instagram: duzenlenenGaleri.instagram,
          website: duzenlenenGaleri.website,
          adres: duzenlenenGaleri.adres,
          sehir: duzenlenenGaleri.sehir,
          calisma_saatleri: duzenlenenGaleri.calisma_saatleri,
          logo_url: duzenlenenGaleri.logo_url || null
        })
        .eq("user_id", duzenlenenGaleri.user_id)
        .select()

      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error("Bu galerinin sahibi siz değilsiniz veya Supabase RLS (Satır Düzeyinde Güvenlik) politikaları bu güncellemeyi engelliyor. Lütfen SQL politikasını Supabase'de çalıştırın.")
      }

      setGalleries(prev => prev.map(g => g.user_id === duzenlenenGaleri.user_id ? { ...duzenlenenGaleri, slug: updatedSlug } : g))
      setMesaj({ tip: "basarili", metin: "Galeri bilgileri başarıyla güncellendi." })
      setDuzenlenenGaleri(null)
    } catch (err: any) {
      console.error(err)
      setMesaj({ tip: "hata", metin: `Güncelleme başarısız: ${err.message || "Yetki yetersiz veya RLS kısıtlaması var."}` })
    } finally {
      setDuzenlemeKaydediliyor(false)
    }
  }

  // Araç Düzenleme Kaydet
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!duzenlenenArac) return

    setDuzenlemeKaydediliyor(true)
    setMesaj(null)

    try {
      const { data, error } = await supabase
        .from("araclar")
        .update({
          marka: duzenlenenArac.marka,
          model: duzenlenenArac.model,
          yil: parseInt(duzenlenenArac.yil) || new Date().getFullYear(),
          versiyon: duzenlenenArac.versiyon,
          renk: duzenlenenArac.renk,
          motor_hacmi: duzenlenenArac.motor_hacmi ? parseInt(duzenlenenArac.motor_hacmi) : null,
          motor_gucu: duzenlenenArac.motor_gucu ? parseInt(duzenlenenArac.motor_gucu) : null,
          vites: duzenlenenArac.vites,
          yakit: duzenlenenArac.yakit,
          kasa_tipi: duzenlenenArac.kasa_tipi,
          km: duzenlenenArac.km ? parseInt(duzenlenenArac.km) : 0,
          hasar_kaydi: duzenlenenArac.hasar_kaydi,
          boyali_parca: duzenlenenArac.boyali_parca ? parseInt(duzenlenenArac.boyali_parca) : 0,
          fiyat: duzenlenenArac.fiyat ? parseFloat(duzenlenenArac.fiyat) : null,
          fiyat_gizle: duzenlenenArac.fiyat_gizle,
          pazarlik_var: duzenlenenArac.pazarlik_var,
          durum: duzenlenenArac.durum,
          fotograflar: duzenlenenArac.fotograflar || []
        })
        .eq("id", duzenlenenArac.id)
        .select()

      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error("Bu aracın sahibi siz değilsiniz veya Supabase RLS (Satır Düzeyinde Güvenlik) politikaları bu güncellemeyi engelliyor. Lütfen SQL politikasını Supabase'de çalıştırın.")
      }

      setVehicles(prev => prev.map(v => v.id === duzenlenenArac.id ? duzenlenenArac : v))
      setMesaj({ tip: "basarili", metin: "Araç bilgileri başarıyla güncellendi." })
      setDuzenlenenArac(null)
    } catch (err: any) {
      console.error(err)
      setMesaj({ tip: "hata", metin: `Güncelleme başarısız: ${err.message || "Yetki yetersiz veya RLS kısıtlaması var."}` })
    } finally {
      setDuzenlemeKaydediliyor(false)
    }
  }

  // Abonelik Planı Güncelleme
  const handleChangePlan = async (userId: string, newPlan: string) => {
    setIslemde(userId)
    setMesaj(null)

    try {
      const { error } = await supabase.rpc("admin_set_gallery_plan", {
        p_user_id: userId,
        p_plan: newPlan,
      })

      if (error) throw error

      setGalleries(prev => prev.map(g => g.user_id === userId ? { ...g, plan: newPlan } : g))
      setMesaj({ tip: "basarili", metin: `Abonelik planı başarıyla "${newPlan}" olarak güncellendi.` })
    } catch (err: any) {
      console.error(err)
      setMesaj({ tip: "hata", metin: `Plan güncellenemedi: ${err.message || "Yetki hatası veya veritabanı RLS engeli."}` })
    } finally {
      setIslemde(null)
    }
  }

  const handleDeleteVehicle = async (id: string, marka: string, model: string) => {
    if (!confirm(`"${marka} ${model}" aracını kalıcı olarak silmek istediğinize emin misiniz?`)) return
    
    setIslemde(id)
    setMesaj(null)

    const targetVehicle = vehicles.find(v => v.id === id)
    const photosToDelete = targetVehicle?.fotograflar || []

    try {
      // 1. Storage'dan fotoğrafları temizle
      if (photosToDelete.length > 0) {
        const paths = photosToDelete
          .map((url: string) => {
            const parts = url.split("/storage/v1/object/public/araclar/")
            return parts.length > 1 ? parts[1] : null
          })
          .filter((p: string | null): p is string => !!p)

        if (paths.length > 0) {
          await supabase.storage.from("araclar").remove(paths)
        }
      }

      // 2. Veritabanından aracı sil
      const { error } = await supabase
        .from("araclar")
        .delete()
        .eq("id", id)

      if (error) throw error

      setVehicles(prev => prev.filter(v => v.id !== id))
      setMesaj({ tip: "basarili", metin: "Araç başarıyla sistemden silindi." })
    } catch (err: any) {
      console.error(err)
      setMesaj({ tip: "hata", metin: `Silme başarısız: ${err.message || "Yetki yetersiz veya RLS kısıtlaması var."}` })
    } finally {
      setIslemde(null)
    }
  }

  const handleDeleteGallery = async (userId: string, galeriAdi: string) => {
    if (!confirm(`"${galeriAdi}" galerisini ve galeriye ait TÜM araçları sistemden silmek istediğinize emin misiniz?\n\nBU İŞLEM GERİ ALINAMAZ!`)) return

    setIslemde(userId)
    setMesaj(null)

    const galleryVehicles = vehicles.filter(v => v.user_id === userId)
    const photosToDelete = galleryVehicles.flatMap(v => v.fotograflar || [])
    
    const targetGallery = galleries.find(g => g.user_id === userId)
    const logoUrl = targetGallery?.logo_url

    const pathsToDelete: string[] = []

    if (logoUrl) {
      const logoParts = logoUrl.split("/storage/v1/object/public/araclar/")
      if (logoParts.length > 1) {
        pathsToDelete.push(logoParts[1])
      }
    }

    photosToDelete.forEach((url) => {
      const parts = url.split("/storage/v1/object/public/araclar/")
      if (parts.length > 1) {
        pathsToDelete.push(parts[1])
      }
    })

    try {
      // 1. Storage'dan logo ve tüm araç fotoğraflarını temizle
      if (pathsToDelete.length > 0) {
        await supabase.storage.from("araclar").remove(pathsToDelete)
      }

      // 2. Önce araçları sil (foreign key varsa korumak için)
      await supabase
        .from("araclar")
        .delete()
        .eq("user_id", userId)

      // 3. Galeriyi sil
      const { error } = await supabase
        .from("galeri_profilleri")
        .delete()
        .eq("user_id", userId)

      if (error) throw error

      setGalleries(prev => prev.filter(g => g.user_id !== userId))
      setVehicles(prev => prev.filter(v => v.user_id !== userId))
      setMesaj({ tip: "basarili", metin: "Galeri ve bağlı tüm araçlar sistemden temizlendi." })
    } catch (err: any) {
      console.error(err)
      setMesaj({ tip: "hata", metin: `Silme başarısız: ${err.message || "Yetki yetersiz veya RLS kısıtlaması var."}` })
    } finally {
      setIslemde(null)
    }
  }

  // Arama filtreleri
  const filtrelenmişGaleriler = galleries.filter(g => {
    const search = galeriArama.toLowerCase()
    const nameMatch = g.galeri_adi ? g.galeri_adi.toLowerCase().includes(search) : false
    const cityMatch = g.sehir ? g.sehir.toLowerCase().includes(search) : false
    const addressMatch = g.adres ? g.adres.toLowerCase().includes(search) : false
    return nameMatch || cityMatch || addressMatch
  })

  const filtrelenmişAraclar = vehicles.filter(v => {
    const search = aracArama.toLowerCase()
    const brandMatch = v.marka ? v.marka.toLowerCase().includes(search) : false
    const modelMatch = v.model ? v.model.toLowerCase().includes(search) : false
    const versionMatch = v.versiyon ? v.versiyon.toLowerCase().includes(search) : false
    const matchArama = brandMatch || modelMatch || versionMatch
    
    const matchDurum = aracDurumFiltre === "Hepsi" || v.durum === aracDurumFiltre
    
    return matchArama && matchDurum
  })

  return (
    <div className="flex flex-col min-h-screen bg-af-bg text-af-text pb-12">
      <PanelTopbar baslik="Süper Yönetici Paneli" aciklama="AutoFlow platformundaki tüm kaynakları ve galerileri denetleyin" />
      
      <main className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
        
        {/* Hata veya Başarı Bildirimi */}
        {mesaj && (
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-2xl border text-sm animate-in fade-in duration-300",
            mesaj.tip === "basarili" 
              ? "bg-af-success/10 border-af-success/20 text-af-success" 
              : "bg-af-error/10 border-af-error/20 text-af-error"
          )}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{mesaj.metin}</p>
          </div>
        )}

        {/* TABS SELECTOR */}
        <div className="flex gap-2 p-1.5 bg-af-surface rounded-2xl border border-af-border max-w-2xl">
          {[
            { id: "stats", label: "Genel Analiz", icon: Activity },
            { id: "galleries", label: "Galeriler", icon: Users },
            { id: "vehicles", label: "Tüm Araçlar", icon: Car },
            { id: "subscriptions", label: "Abonelikler", icon: Sparkles },
            { id: "notifications", label: "Bildirim Gönder", icon: Bell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setAktifTab(tab.id as any); setMesaj(null) }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                aktifTab === tab.id
                  ? "bg-af-accent text-white shadow-lg shadow-af-accent/15"
                  : "text-af-text-secondary hover:text-white hover:bg-af-surface-2"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: GENEL ANALİZ */}
        {aktifTab === "stats" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Hızlı Kartlar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-af-surface border border-af-border rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute right-4 top-4 w-12 h-12 rounded-xl bg-af-accent/10 flex items-center justify-center text-af-accent group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-af-text-secondary text-sm">Kayıtlı Galeri</p>
                <h3 className="text-3xl font-black text-white mt-1.5">{totalGalleries}</h3>
                <p className="text-xs text-af-text-disabled mt-2">Toplam aktif bayi/üye sayısı</p>
              </div>

              <div className="bg-af-surface border border-af-border rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute right-4 top-4 w-12 h-12 rounded-xl bg-af-info/10 flex items-center justify-center text-af-info group-hover:scale-110 transition-transform">
                  <Car className="w-5 h-5" />
                </div>
                <p className="text-af-text-secondary text-sm">Platform Araç Sayısı</p>
                <h3 className="text-3xl font-black text-white mt-1.5">{totalVehicles}</h3>
                <p className="text-xs text-af-text-disabled mt-2">{activeVehicles} Satışta · {soldVehicles} Satılan</p>
              </div>

              <div className="bg-af-surface border border-af-border rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute right-4 top-4 w-12 h-12 rounded-xl bg-af-success/10 flex items-center justify-center text-af-success group-hover:scale-110 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <p className="text-af-text-secondary text-sm">Toplam QR Okutma</p>
                <h3 className="text-3xl font-black text-white mt-1.5">{totalScans}</h3>
                <p className="text-xs text-af-text-disabled mt-2">QR etiketlerinden gelen trafik</p>
              </div>

              <div className="bg-af-surface border border-af-border rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute right-4 top-4 w-12 h-12 rounded-xl bg-af-accent-active/10 flex items-center justify-center text-af-accent-active group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <p className="text-af-text-secondary text-sm">Ort. Araç / Galeri</p>
                <h3 className="text-3xl font-black text-white mt-1.5">
                  {totalGalleries > 0 ? (totalVehicles / totalGalleries).toFixed(1) : "0"}
                </h3>
                <p className="text-xs text-af-text-disabled mt-2">Bayi başına ortalama ilan</p>
              </div>
            </div>

            {/* Ekstra Analiz Kutuları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cihaz Dağılımı */}
              <div className="bg-af-surface border border-af-border rounded-2xl p-6">
                <h4 className="font-bold text-white text-base mb-4">Müşteri Cihaz Dağılımı (QR Tarama)</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2 text-af-text-secondary">
                        <Smartphone className="w-4 h-4 text-af-accent" /> Mobil Cihazlar
                      </span>
                      <span className="font-bold text-white">
                        {totalScans > 0 ? `${((mobileScans / totalScans) * 100).toFixed(0)}%` : "0%"} ({mobileScans})
                      </span>
                    </div>
                    <div className="w-full bg-af-surface-2 rounded-full h-2">
                      <div className="bg-af-accent h-2 rounded-full" style={{ width: totalScans > 0 ? `${(mobileScans / totalScans) * 100}%` : "0%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2 text-af-text-secondary">
                        <Monitor className="w-4 h-4 text-af-info" /> Masaüstü / PC
                      </span>
                      <span className="font-bold text-white">
                        {totalScans > 0 ? `${((desktopScans / totalScans) * 100).toFixed(0)}%` : "0%"} ({desktopScans})
                      </span>
                    </div>
                    <div className="w-full bg-af-surface-2 rounded-full h-2">
                      <div className="bg-af-info h-2 rounded-full" style={{ width: totalScans > 0 ? `${(desktopScans / totalScans) * 100}%` : "0%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="flex items-center gap-2 text-af-text-secondary">
                        <Tablet className="w-4 h-4 text-af-success" /> Tablet
                      </span>
                      <span className="font-bold text-white">
                        {totalScans > 0 ? `${((tabletScans / totalScans) * 100).toFixed(0)}%` : "0%"} ({tabletScans})
                      </span>
                    </div>
                    <div className="w-full bg-af-surface-2 rounded-full h-2">
                      <div className="bg-af-success h-2 rounded-full" style={{ width: totalScans > 0 ? `${(tabletScans / totalScans) * 100}%` : "0%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Son Hareketler logu */}
              <div className="bg-af-surface border border-af-border rounded-2xl p-6">
                <h4 className="font-bold text-white text-base mb-4">Son QR Okutma Hareketleri</h4>
                {scans.length === 0 ? (
                  <p className="text-af-text-disabled text-sm text-center py-8">Henüz tarama hareketi yok.</p>
                ) : (
                  <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
                    {scans.slice(0, 5).map((scan, index) => (
                      <div key={index} className="flex justify-between items-center bg-af-surface-2/40 p-2.5 rounded-xl border border-af-border/60">
                        <div>
                          <p className="text-xs font-semibold text-white">Tarama Gerçekleşti</p>
                          <p className="text-[10px] text-af-text-disabled">Cihaz: {scan.device_type === "mobile" ? "Mobil" : scan.device_type === "tablet" ? "Tablet" : "Masaüstü"}</p>
                        </div>
                        <span className="text-[10px] text-af-text-disabled bg-af-surface border border-af-border px-2 py-0.5 rounded-md">
                          {new Date(scan.created_at).toLocaleTimeString("tr-TR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GALERİLER YÖNETİMİ */}
        {aktifTab === "galleries" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filtre ve Arama */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-af-text-disabled" />
              <input
                type="text"
                placeholder="Galeri adı, şehir veya adres ara..."
                className="w-full bg-af-surface border border-af-border text-af-text rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-af-accent transition-colors"
                value={galeriArama}
                onChange={(e) => setGaleriArama(e.target.value)}
              />
            </div>

            {/* Liste */}
            <div className="bg-af-surface border border-af-border rounded-2xl overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-af-border text-af-text-disabled text-xs font-semibold uppercase bg-af-surface-2/30">
                    <th className="p-4">Logo / İsim</th>
                    <th className="p-4">Şehir / Konum</th>
                    <th className="p-4">Telefon</th>
                    <th className="p-4 text-center">İlan Sayısı</th>
                    <th className="p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-af-border text-sm">
                  {filtrelenmişGaleriler.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-af-text-disabled">Arama kriterine uygun galeri bulunamadı.</td>
                    </tr>
                  ) : (
                    filtrelenmişGaleriler.map((gal) => {
                      const vCount = getVehicleCount(gal.user_id)
                      const isSelf = islemde === gal.user_id
                      
                      return (
                        <tr key={gal.user_id} className="hover:bg-af-surface-2/10 transition-colors">
                          <td className="p-4">
                            {gal.slug ? (
                              <a 
                                href={`/galeri/${gal.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 group/item hover:opacity-85 transition-opacity"
                              >
                                <div className="w-9 h-9 rounded-lg bg-af-accent flex items-center justify-center text-white font-black text-sm group-hover/item:scale-105 transition-transform">
                                  {gal.galeri_adi ? gal.galeri_adi.substring(0, 2).toUpperCase() : "G"}
                                </div>
                                <div>
                                  <p className="font-bold text-white group-hover/item:text-af-accent transition-colors flex items-center gap-1">
                                    {gal.galeri_adi || "İsimsiz Galeri"}
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                  </p>
                                  <p className="text-[10px] text-af-text-disabled">slug: {gal.slug}</p>
                                </div>
                              </a>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-af-accent flex items-center justify-center text-white font-black text-sm">
                                  {gal.galeri_adi ? gal.galeri_adi.substring(0, 2).toUpperCase() : "G"}
                                </div>
                                <div>
                                  <p className="font-bold text-white">{gal.galeri_adi || "İsimsiz Galeri"}</p>
                                  <p className="text-[10px] text-af-text-disabled">slug: Yok</p>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-af-text-secondary">{gal.sehir || "—"}</td>
                          <td className="p-4 text-af-text-secondary">{gal.telefon || "—"}</td>
                          <td className="p-4 text-center font-semibold text-white">{vCount}</td>
                          <td className="p-4 text-right space-x-1.5">
                            <a 
                              href={`/galeri/${gal.slug}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs bg-af-surface-2 hover:bg-af-border border border-af-border hover:text-white px-2.5 py-1.5 rounded-lg text-af-text-secondary transition-colors"
                            >
                              Görüntüle <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => setDuzenlenenGaleri({ ...gal })}
                              className="inline-flex items-center gap-1 text-xs bg-af-accent/10 hover:bg-af-accent/20 border border-af-accent/20 text-af-accent px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              Düzenle <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteGallery(gal.user_id, gal.galeri_adi)}
                              disabled={isSelf}
                              className="inline-flex items-center gap-1 text-xs bg-af-error/10 hover:bg-af-error/20 border border-af-error/20 text-af-error px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isSelf ? "Siliniyor..." : "Galeriyi Sil"}
                              {!isSelf && <Trash2 className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: TÜM ARAÇLAR YÖNETİMİ */}
        {aktifTab === "vehicles" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Filtre ve Arama çubuğu */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-2">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-af-text-disabled" />
                <input
                  type="text"
                  placeholder="Araç marka, model veya versiyon ara..."
                  className="w-full bg-af-surface border border-af-border text-af-text rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-af-accent transition-colors"
                  value={aracArama}
                  onChange={(e) => setAracArama(e.target.value)}
                />
              </div>

              <select
                className="bg-af-surface border border-af-border text-af-text rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-af-accent cursor-pointer"
                value={aracDurumFiltre}
                onChange={(e) => setAracDurumFiltre(e.target.value)}
              >
                <option value="Hepsi">Tüm Durumlar</option>
                <option value="Aktif">Satışta (Aktif)</option>
                <option value="Satildi">Satıldı</option>
                <option value="Pasif">Pasif</option>
              </select>
            </div>

            {/* Liste */}
            <div className="bg-af-surface border border-af-border rounded-2xl overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-af-border text-af-text-disabled text-xs font-semibold uppercase bg-af-surface-2/30">
                    <th className="p-4">Görsel / Araç</th>
                    <th className="p-4">Sahibi Galeri</th>
                    <th className="p-4">Fiyat</th>
                    <th className="p-4">Durum</th>
                    <th className="p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-af-border text-sm">
                  {filtrelenmişAraclar.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-af-text-disabled">Arama kriterine uygun araç bulunamadı.</td>
                    </tr>
                  ) : (
                    filtrelenmişAraclar.map((arac) => {
                      const isSelf = islemde === arac.id
                      const coverFoto = arac.fotograflar?.[0] || "/placeholder.jpg"

                      return (
                        <tr key={arac.id} className="hover:bg-af-surface-2/10 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-10 rounded-lg overflow-hidden bg-af-surface-2 border border-af-border flex-shrink-0">
                                <img src={coverFoto} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-bold text-white">{arac.yil} {arac.marka} {arac.model}</p>
                                <p className="text-[10px] text-af-text-disabled">{arac.versiyon || "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-af-text-secondary">{getGalleryName(arac.user_id)}</td>
                          <td className="p-4 font-bold text-white">
                            {arac.fiyat_gizle ? "Fiyat Gizli" : arac.fiyat ? `₺${Number(arac.fiyat).toLocaleString("tr-TR")}` : "—"}
                          </td>
                          <td className="p-4">
                            <span className={cn(
                              "text-xs px-2.5 py-0.5 rounded-full border font-medium",
                              arac.durum === "Aktif" && "bg-af-success/10 border-af-success/20 text-af-success",
                              arac.durum === "Satildi" && "bg-af-error/10 border-af-error/20 text-af-error",
                              arac.durum === "Pasif" && "bg-af-surface-2 border-af-border text-af-text-secondary"
                            )}>
                              {arac.durum === "Aktif" ? "Satışta" : arac.durum === "Satildi" ? "Satıldı" : "Pasif"}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-1.5">
                            <a 
                              href={`/arac/${arac.id}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs bg-af-surface-2 hover:bg-af-border border border-af-border hover:text-white px-2.5 py-1.5 rounded-lg text-af-text-secondary transition-colors"
                            >
                              Sayfa Git <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => setDuzenlenenArac({ ...arac })}
                              className="inline-flex items-center gap-1 text-xs bg-af-accent/10 hover:bg-af-accent/20 border border-af-accent/20 text-af-accent px-2.5 py-1.5 rounded-lg transition-colors"
                            >
                              Düzenle <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteVehicle(arac.id, arac.marka, arac.model)}
                              disabled={isSelf}
                              className="inline-flex items-center gap-1 text-xs bg-af-error/10 hover:bg-af-error/20 border border-af-error/20 text-af-error px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isSelf ? "Siliniyor..." : "Aracı Sil"}
                              {!isSelf && <Trash2 className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: ABONELİKLER */}
        {aktifTab === "subscriptions" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-af-accent/10 border border-af-accent/20 rounded-2xl p-4 text-sm text-af-accent flex items-start gap-3">
              <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Abonelik Yönetim Sistemi</p>
                <p className="text-af-text-secondary text-xs mt-0.5">
                  Galerilerin aktif üyelik planlarını değiştirebilirsiniz. Değişiklikler veritabanına anında yansır ve galeri sahipleri kendi panellerinde anlık olarak güncel limitlerini görür.
                </p>
              </div>
            </div>

            {/* Liste */}
            <div className="bg-af-surface border border-af-border rounded-2xl overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-af-border text-af-text-disabled text-xs font-semibold uppercase bg-af-surface-2/30">
                    <th className="p-4">Galeri</th>
                    <th className="p-4">Mevcut Plan</th>
                    <th className="p-4 text-center">İlan Sayısı</th>
                    <th className="p-4">İlan Limiti</th>
                    <th className="p-4">Abonelik Ücreti</th>
                    <th className="p-4 text-right">Plan Değiştir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-af-border text-sm">
                  {galleries.map((gal) => {
                    const isSelf = islemde === gal.user_id
                    const currentPlan = gal.plan || "Essential"

                    return (
                      <tr key={gal.user_id} className="hover:bg-af-surface-2/10 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-white">{gal.galeri_adi || "İsimsiz Galeri"}</p>
                          <p className="text-[10px] text-af-text-disabled">{gal.slug}</p>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full border font-semibold",
                            currentPlan === "Elite" && "text-af-accent bg-af-accent/10 border-af-accent/20",
                            currentPlan === "Professional" && "text-af-info bg-af-info/10 border-af-info/20",
                            currentPlan === "Essential" && "text-af-text-secondary bg-af-surface-2 border-af-border"
                          )}>
                            {currentPlan === "Elite" ? "Elite" : currentPlan === "Professional" ? "Professional" : "Essential"}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-white">
                          {getVehicleCount(gal.user_id)}
                        </td>
                        <td className="p-4 text-af-text-secondary">
                          {currentPlan === "Elite" ? "Sınırsız İlan" : currentPlan === "Professional" ? "Maks. 30 İlan" : "Maks. 3 İlan"}
                        </td>
                        <td className="p-4 text-white font-bold">
                          {currentPlan === "Elite" ? "4.990 ₺ / Ay" : currentPlan === "Professional" ? "2.990 ₺ / Ay" : "Ücretsiz"}
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={currentPlan}
                            disabled={isSelf}
                            onChange={(e) => handleChangePlan(gal.user_id, e.target.value)}
                            className="bg-af-surface-2 border border-af-border text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus:border-af-accent cursor-pointer disabled:opacity-50"
                          >
                            <option value="Essential">Essential (Ücretsiz / 3 İlan)</option>
                            <option value="Professional">Professional (2.990₺ / 30 İlan)</option>
                            <option value="Elite">Elite (4.990₺ / Sınırsız)</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: BİLDİRİM GÖNDER */}
        {aktifTab === "notifications" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-af-accent/10 border border-af-accent/20 rounded-2xl p-4 text-sm text-af-accent flex items-start gap-3">
              <Bell className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Akıllı Bildirim Gönderme Paneli</p>
                <p className="text-af-text-secondary text-xs mt-0.5">
                  Buradan tüm kullanıcıların paneline genel (global) duyuru gönderebilir veya belirli bir galeriyi seçerek doğrudan ona özel bildirim iletebilirsiniz.
                </p>
              </div>
            </div>

            <div className="max-w-xl bg-af-surface border border-af-border rounded-3xl p-6 shadow-xl">
              <form onSubmit={handleSendNotification} className="space-y-4">
                {/* Bildirim Hedefi */}
                <div>
                  <label className="block text-af-text-secondary text-xs font-black uppercase tracking-wider mb-2">Alıcı Hedefi</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifTarget("all")
                        setNotifUserId("")
                      }}
                      className={cn(
                        "py-3 rounded-xl text-xs font-bold border transition-all text-center",
                        notifTarget === "all"
                          ? "bg-af-accent border-af-accent text-white shadow-lg shadow-af-accent/10"
                          : "bg-af-surface-2 border-af-border text-af-text-secondary hover:text-white"
                      )}
                    >
                      📢 Tüm Kullanıcılar (Global)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifTarget("single")
                        if (galleries.length > 0) {
                          setNotifUserId(galleries[0].user_id)
                        }
                      }}
                      className={cn(
                        "py-3 rounded-xl text-xs font-bold border transition-all text-center",
                        notifTarget === "single"
                          ? "bg-af-accent border-af-accent text-white shadow-lg shadow-af-accent/10"
                          : "bg-af-surface-2 border-af-border text-af-text-secondary hover:text-white"
                      )}
                    >
                      👤 Belirli Bir Galeri (Özel)
                    </button>
                  </div>
                </div>

                {/* Galeri Seçimi (Eğer tek kullanıcı ise) */}
                {notifTarget === "single" && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-af-text-secondary text-xs font-black uppercase tracking-wider mb-2">Hedef Galeri Seçin</label>
                    <select
                      value={notifUserId}
                      onChange={(e) => setNotifUserId(e.target.value)}
                      required
                      className="w-full bg-af-surface-2 border border-af-border text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-af-accent cursor-pointer"
                    >
                      {galleries.map((gal: any) => (
                        <option key={gal.user_id} value={gal.user_id}>
                          {gal.galeri_adi} ({gal.ad || gal.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Başlık */}
                <div>
                  <label className="block text-af-text-secondary text-xs font-black uppercase tracking-wider mb-2">Bildirim Başlığı</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Sistem Bakım Çalışması"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    className="w-full bg-af-surface-2 border border-af-border text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-af-accent placeholder:text-af-text-disabled"
                  />
                </div>

                {/* Açıklama */}
                <div>
                  <label className="block text-af-text-secondary text-xs font-black uppercase tracking-wider mb-2">Bildirim Mesajı (Açıklama)</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Kullanıcıların göreceği mesaj detaylarını buraya yazın..."
                    value={notifDesc}
                    onChange={(e) => setNotifDesc(e.target.value)}
                    className="w-full bg-af-surface-2 border border-af-border text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:border-af-accent placeholder:text-af-text-disabled resize-none"
                  />
                </div>

                {/* Gönder butonu */}
                <button
                  type="submit"
                  disabled={notifSending || !notifTitle.trim() || !notifDesc.trim()}
                  className="w-full bg-af-accent hover:bg-af-accent-hover text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-af-accent/15 flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {notifSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Bildirimi Yayınla
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* GALERİ DÜZENLEME MODAL */}
      {duzenlenenGaleri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-af-surface border border-af-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-af-border">
              <h3 className="font-bold text-white text-lg">Galeri Düzenle: {duzenlenenGaleri.galeri_adi}</h3>
              <button 
                type="button" 
                onClick={() => setDuzenlenenGaleri(null)} 
                className="text-af-text-disabled hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveGallery} className="p-6 overflow-y-auto space-y-4 flex-1">

              {/* Profil Fotoğrafı (Logo) */}
              <div>
                <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-2">Profil Fotoğrafı (Logo)</label>
                <div className="flex items-start gap-4">
                  {/* Mevcut logo önizlemesi */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-af-surface-2 border border-af-border flex items-center justify-center flex-shrink-0 relative">
                    {duzenlenenGaleri.logo_url ? (
                      <>
                        <img src={duzenlenenGaleri.logo_url} alt="Logo" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setDuzenlenenGaleri({ ...duzenlenenGaleri, logo_url: null })}
                          className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 hover:bg-af-error rounded-full flex items-center justify-center transition-colors"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </>
                    ) : (
                      <span className="text-2xl font-black text-af-accent">
                        {duzenlenenGaleri.galeri_adi ? duzenlenenGaleri.galeri_adi.substring(0, 2).toUpperCase() : "G"}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Mod seçici */}
                    <div className="flex gap-1 p-1 bg-af-surface-2 rounded-lg border border-af-border w-fit">
                      <button
                        type="button"
                        onClick={() => setLogoUploadMode("file")}
                        className={cn(
                          "text-xs px-3 py-1 rounded-md font-semibold transition-all",
                          logoUploadMode === "file" ? "bg-af-accent text-white" : "text-af-text-secondary hover:text-white"
                        )}
                      >
                        Dosya Yükle
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogoUploadMode("url")}
                        className={cn(
                          "text-xs px-3 py-1 rounded-md font-semibold transition-all",
                          logoUploadMode === "url" ? "bg-af-accent text-white" : "text-af-text-secondary hover:text-white"
                        )}
                      >
                        URL ile
                      </button>
                    </div>

                    {logoUploadMode === "file" ? (
                      <label className={cn(
                        "flex items-center gap-2 cursor-pointer border border-dashed border-af-border hover:border-af-accent/50 bg-af-surface-2/50 hover:bg-af-accent/5 rounded-xl px-4 py-2.5 text-sm text-af-text-secondary hover:text-af-accent transition-all",
                        logoUploading && "opacity-60 pointer-events-none"
                      )}>
                        {logoUploading ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Yükleniyor...</>
                        ) : (
                          <><Upload className="w-4 h-4" /> Logo seç (JPG, PNG)</>  
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoFileChange}
                          disabled={logoUploading}
                        />
                      </label>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://... logo URL'si"
                          className={inputClass}
                          value={logoUrlInput}
                          onChange={(e) => setLogoUrlInput(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (logoUrlInput.startsWith("http")) {
                              setDuzenlenenGaleri({ ...duzenlenenGaleri, logo_url: logoUrlInput.trim() })
                              setLogoUrlInput("")
                            }
                          }}
                          className="bg-af-accent hover:bg-af-accent-hover text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors whitespace-nowrap flex-shrink-0"
                        >
                          Uygula
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Galeri Adı</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={duzenlenenGaleri.galeri_adi || ""}
                    onChange={(e) => setDuzenlenenGaleri({ ...duzenlenenGaleri, galeri_adi: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Telefon</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={duzenlenenGaleri.telefon || ""}
                    onChange={(e) => setDuzenlenenGaleri({ ...duzenlenenGaleri, telefon: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">WhatsApp</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={duzenlenenGaleri.whatsapp || ""}
                    onChange={(e) => setDuzenlenenGaleri({ ...duzenlenenGaleri, whatsapp: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Instagram</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={duzenlenenGaleri.instagram || ""}
                    onChange={(e) => setDuzenlenenGaleri({ ...duzenlenenGaleri, instagram: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Web Sitesi</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={duzenlenenGaleri.website || ""}
                    onChange={(e) => setDuzenlenenGaleri({ ...duzenlenenGaleri, website: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">İlyeri Adresi</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={duzenlenenGaleri.adres || ""}
                    onChange={(e) => setDuzenlenenGaleri({ ...duzenlenenGaleri, adres: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Şehir</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={duzenlenenGaleri.sehir || ""}
                    onChange={(e) => setDuzenlenenGaleri({ ...duzenlenenGaleri, sehir: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Hafta İçi Çalışma Saatleri</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={duzenlenenGaleri.calisma_saatleri?.hafta_ici || ""}
                    onChange={(e) => setDuzenlenenGaleri({
                      ...duzenlenenGaleri,
                      calisma_saatleri: {
                        ...duzenlenenGaleri.calisma_saatleri,
                        hafta_ici: e.target.value
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Hafta Sonu Çalışma Saatleri</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={duzenlenenGaleri.calisma_saatleri?.hafta_sonu || ""}
                    onChange={(e) => setDuzenlenenGaleri({
                      ...duzenlenenGaleri,
                      calisma_saatleri: {
                        ...duzenlenenGaleri.calisma_saatleri,
                        hafta_sonu: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-af-border mt-4">
                <button
                  type="button"
                  onClick={() => setDuzenlenenGaleri(null)}
                  className="bg-af-surface hover:bg-af-surface-2 text-af-text-secondary px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors border border-af-border"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={duzenlemeKaydediliyor}
                  className="bg-af-accent hover:bg-af-accent-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {duzenlemeKaydediliyor ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ARAÇ DÜZENLEME MODAL */}
      {duzenlenenArac && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-af-surface border border-af-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-af-border">
              <h3 className="font-bold text-white text-lg">Araç Düzenle: {duzenlenenArac.marka} {duzenlenenArac.model}</h3>
              <button 
                type="button" 
                onClick={() => setDuzenlenenArac(null)} 
                className="text-af-text-disabled hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveVehicle} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Marka</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={duzenlenenArac.marka || ""}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, marka: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Model</label>
                  <input
                    type="text"
                    required
                    className={inputClass}
                    value={duzenlenenArac.model || ""}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, model: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Yıl</label>
                  <input
                    type="number"
                    required
                    className={inputClass}
                    value={duzenlenenArac.yil || ""}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, yil: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Versiyon / Donanım</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={duzenlenenArac.versiyon || ""}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, versiyon: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Fiyat (₺)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={duzenlenenArac.fiyat || ""}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, fiyat: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Kilometre</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={duzenlenenArac.km || ""}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, km: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Renk</label>
                  <input
                    type="text"
                    className={inputClass}
                    value={duzenlenenArac.renk || ""}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, renk: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Boyalı Parça Sayısı</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={duzenlenenArac.boyali_parca || 0}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, boyali_parca: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Vites</label>
                  <select
                    className="w-full bg-af-surface border border-af-border text-af-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-af-accent cursor-pointer"
                    value={duzenlenenArac.vites || ""}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, vites: e.target.value })}
                  >
                    {VITESLER.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Yakıt</label>
                  <select
                    className="w-full bg-af-surface border border-af-border text-af-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-af-accent cursor-pointer"
                    value={duzenlenenArac.yakit || ""}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, yakit: e.target.value })}
                  >
                    {YAKITLAR.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Kasa Tipi</label>
                  <select
                    className="w-full bg-af-surface border border-af-border text-af-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-af-accent cursor-pointer"
                    value={duzenlenenArac.kasa_tipi || ""}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, kasa_tipi: e.target.value })}
                  >
                    {KASALAR.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-semibold uppercase mb-1.5">Araç Durumu</label>
                  <select
                    className="w-full bg-af-surface border border-af-border text-af-text rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-af-accent cursor-pointer"
                    value={duzenlenenArac.durum || ""}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, durum: e.target.value })}
                  >
                    <option value="Aktif">Satışta (Aktif)</option>
                    <option value="Satildi">Satıldı</option>
                    <option value="Pasif">Pasif</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 bg-af-surface-2/40 border border-af-border/60 p-4 rounded-xl md:col-span-2">
                  <input
                    type="checkbox"
                    id="hasar_kaydi"
                    className="w-4 h-4 rounded accent-af-accent"
                    checked={duzenlenenArac.hasar_kaydi || false}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, hasar_kaydi: e.target.checked })}
                  />
                  <label htmlFor="hasar_kaydi" className="text-sm font-medium text-white cursor-pointer select-none">
                    Hasar Kaydı Var
                  </label>
                </div>
                <div className="flex items-center gap-3 bg-af-surface-2/40 border border-af-border/60 p-4 rounded-xl md:col-span-2">
                  <input
                    type="checkbox"
                    id="fiyat_gizle"
                    className="w-4 h-4 rounded accent-af-accent"
                    checked={duzenlenenArac.fiyat_gizle || false}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, fiyat_gizle: e.target.checked })}
                  />
                  <label htmlFor="fiyat_gizle" className="text-sm font-medium text-white cursor-pointer select-none font-semibold">
                    Fiyatı Gizle (Müşteriye "Fiyat için arayın" gösterilir)
                  </label>
                </div>
                <div className="flex items-center gap-3 bg-af-surface-2/40 border border-af-border/60 p-4 rounded-xl md:col-span-2">
                  <input
                    type="checkbox"
                    id="pazarlik_var"
                    className="w-4 h-4 rounded accent-af-accent"
                    checked={duzenlenenArac.pazarlik_var || false}
                    onChange={(e) => setDuzenlenenArac({ ...duzenlenenArac, pazarlik_var: e.target.checked })}
                  />
                  <label htmlFor="pazarlik_var" className="text-sm font-medium text-white cursor-pointer select-none">
                    Pazarlığa Açık
                  </label>
                </div>

                {/* Araç Görsel Yönetimi */}
                <div className="md:col-span-2 border-t border-af-border/60 pt-4 mt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white uppercase tracking-wider">Araç Fotoğrafları</label>
                    <div className="flex gap-1 bg-af-surface p-0.5 rounded-lg border border-af-border">
                      <button
                        type="button"
                        onClick={() => setUploadMode("file")}
                        className={cn("px-3 py-1 rounded text-xs font-semibold transition-all",
                          uploadMode === "file" ? "bg-af-accent text-white" : "text-af-text-disabled"
                        )}
                      >
                        Dosya Yükle
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadMode("url")}
                        className={cn("px-3 py-1 rounded text-xs font-semibold transition-all",
                          uploadMode === "url" ? "bg-af-accent text-white" : "text-af-text-disabled"
                        )}
                      >
                        URL ile Ekle
                      </button>
                    </div>
                  </div>

                  {uploadMode === "file" ? (
                    <div className="border border-dashed border-af-border rounded-xl p-6 text-center hover:bg-af-surface/40 transition-colors relative">
                      <input
                        id="admin-file-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleAdminFileChange}
                        disabled={uploading}
                      />
                      <button
                        type="button"
                        disabled={uploading}
                        onClick={() => document.getElementById("admin-file-upload")?.click()}
                        className="bg-af-surface-2 border border-af-border hover:border-af-accent text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 mx-auto"
                      >
                        <Upload className="w-3.5 h-3.5" /> Fotoğraf Seç
                      </button>
                      <p className="text-[11px] text-af-text-disabled mt-2">Sıkıştırılmış JPEG dosyası yüklenir.</p>
                      {uploading && (
                        <div className="absolute inset-0 bg-af-bg/80 flex items-center justify-center rounded-xl">
                          <Loader2 className="w-6 h-6 animate-spin text-af-accent" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://... (fotoğraf URL'i)"
                        className="flex-1 bg-af-surface border border-af-border rounded-xl px-3 py-2 text-xs text-af-text focus:outline-none focus:border-af-accent"
                        value={yeniFotoUrl}
                        onChange={(e) => setYeniFotoUrl(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAdminFotoUrl())}
                      />
                      <button
                        type="button"
                        onClick={addAdminFotoUrl}
                        className="bg-af-accent hover:bg-af-accent-hover text-white px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Ekle
                      </button>
                    </div>
                  )}

                  {/* Fotoğraf Listesi */}
                  {duzenlenenArac.fotograflar && duzenlenenArac.fotograflar.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-2">
                      {duzenlenenArac.fotograflar.map((url: string, i: number) => (
                        <div key={i} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-af-border bg-af-surface-2 group">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          {i === 0 && (
                            <span className="absolute top-1.5 left-1.5 text-[8px] bg-af-accent text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider shadow">Kapak</span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeAdminFoto(i)}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 hover:bg-af-error text-white flex items-center justify-center transition-colors shadow z-10"
                            title="Görseli Sil"
                          >
                            <X className="w-3 h-3" />
                          </button>

                          {/* Controls */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-1 flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-0.5">
                              {i > 0 && (
                                <button
                                  type="button"
                                  onClick={() => moveAdminFoto(i, "left")}
                                  className="w-5 h-5 rounded bg-black/65 hover:bg-af-accent text-white flex items-center justify-center"
                                >
                                  <ArrowLeft className="w-2.5 h-2.5" />
                                </button>
                              )}
                              {i < duzenlenenArac.fotograflar.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => moveAdminFoto(i, "right")}
                                  className="w-5 h-5 rounded bg-black/65 hover:bg-af-accent text-white flex items-center justify-center"
                                >
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                            {i > 0 && (
                              <button
                                type="button"
                                onClick={() => makeAdminCover(i)}
                                className="text-[8px] bg-black/65 hover:bg-af-accent text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                              >
                                Kapak
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-af-text-disabled text-center py-4 bg-af-surface/20 rounded-xl border border-af-border">Görsel bulunmuyor</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-af-border mt-4">
                <button
                  type="button"
                  onClick={() => setDuzenlenenArac(null)}
                  className="bg-af-surface hover:bg-af-surface-2 text-af-text-secondary px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors border border-af-border"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={duzenlemeKaydediliyor}
                  className="bg-af-accent hover:bg-af-accent-hover text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {duzenlemeKaydediliyor ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
