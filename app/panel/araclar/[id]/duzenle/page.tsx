"use client"

import { useEffect, useState, use } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Save, Check, Plus, X, AlertCircle, Loader2, Image as ImageIcon, Upload, Trash2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ArabaKrokisi } from "@/components/autoflow/araba-krokisi"

const MARKALAR = ["BMW", "Mercedes-Benz", "Audi", "Toyota", "Volkswagen", "Ford", "Renault", "Peugeot", "Hyundai", "Kia", "Honda", "Volvo", "Land Rover", "Porsche", "Ferrari", "Lamborghini"]
const KASALAR = ["Sedan", "Hatchback", "SUV", "Coupe", "Pickup", "Cabrio", "Station Wagon", "Minivan"]
const VITESLER = ["Manuel", "Otomatik", "Yarı-Otomatik"]
const YAKITLAR = ["Benzin", "Dizel", "Elektrik", "Hybrid", "LPG"]
const RENKLER = ["Beyaz", "Siyah", "Gümüş", "Gri", "Kırmızı", "Mavi", "Lacivert", "Yeşil", "Sarı", "Turuncu", "Kahverengi", "Bordo"]

const POPULER_OZELLIKLER = [
  "Isıtmalı Koltuklar", "Sunroof / Panoramik Tavan", "Geri Görüş Kamerası",
  "Apple CarPlay / Android Auto", "Navigasyon", "LED Farlar",
  "Park Sensörü", "Keyless Go / Keyless Entry", "Deri Döşeme",
  "Şerit Takip Sistemi", "Adaptif Hız Sabitleyici", "Wireless Şarj",
  "360° Kamera", "Ventilasyonlu Koltuklar", "Head-Up Display",
]

interface PageProps {
  params: Promise<{ id: string }>
}

export default function DuzenleAracPage({ params }: PageProps) {
  const { id } = use(params)
  const { user } = useAuth()
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState("")
  const [basarili, setBasarili] = useState(false)

  interface TramerItem {
    yil: string
    tutar: string
  }

  const [form, setForm] = useState({
    marka: "", model: "", yil: "", versiyon: "", renk: "",
    motor_hacmi: "", motor_gucu: "", vites: "Otomatik", yakit: "Benzin", kasa_tipi: "Sedan",
    km: "", hasar_kaydi: false, boyali_parcalar: [] as string[],
    tramer_kaydi: false, tramer_detay: [] as TramerItem[], agir_hasar_kaydi: false,
    foto_urls: [] as string[], fiyat: "", fiyat_gizle: false, pazarlik_var: false,
    ozellikler: [] as string[], durum: "Aktif" as "Aktif" | "Satildi" | "Pasif",
    aciklama: ""
  })

  const [yeniTramer, setYeniTramer] = useState<TramerItem>({ yil: "", tutar: "" })
  const [yeniFotoUrl, setYeniFotoUrl] = useState("")
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file")
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Aracın mevcut verilerini yükle
  useEffect(() => {
    if (!user) return
    async function aracYukle() {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from("araclar")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.id)
          .single()

        if (error || !data) {
          setHata("Araç bulunamadı veya bu işlem için yetkiniz yok.")
          setLoading(false)
          return
        }

        setForm({
          marka: data.marka || "",
          model: data.model || "",
          yil: String(data.yil || ""),
          versiyon: data.versiyon || "",
          renk: data.renk || "",
          motor_hacmi: String(data.motor_hacmi || ""),
          motor_gucu: String(data.motor_gucu || ""),
          vites: data.vites || "Otomatik",
          yakit: data.yakit || "Benzin",
          kasa_tipi: data.kasa_tipi || "Sedan",
          km: String(data.km || ""),
          hasar_kaydi: !!data.hasar_kaydi,
          boyali_parcalar: data.boyali_parcalar || [],
          tramer_kaydi: !!data.tramer_kaydi,
          tramer_detay: (data.tramer_detay || []).map((t: any) => ({
            yil: String(t.yil || ""),
            tutar: String(t.tutar || "")
          })),
          agir_hasar_kaydi: !!data.agir_hasar_kaydi,
          foto_urls: data.fotograflar || [],
          fiyat: String(data.fiyat || ""),
          fiyat_gizle: !!data.fiyat_gizle,
          pazarlik_var: !!data.pazarlik_var,
          ozellikler: data.ozellikler || [],
          durum: data.durum || "Aktif",
          aciklama: data.aciklama || "",
        })
      } catch (err) {
        console.error(err)
        setHata("Veri yüklenirken beklenmeyen bir hata oluştu.")
      } finally {
        setLoading(false)
      }
    }
    aracYukle()
  }, [id, user])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setKaydediliyor(true)
    setHata("")

    try {
      const { error } = await supabase
        .from("araclar")
        .update({
          marka: form.marka,
          model: form.model,
          yil: parseInt(form.yil) || new Date().getFullYear(),
          versiyon: form.versiyon,
          renk: form.renk,
          motor_hacmi: form.motor_hacmi ? parseInt(form.motor_hacmi) : null,
          motor_gucu: form.motor_gucu ? parseInt(form.motor_gucu) : null,
          vites: form.vites,
          yakit: form.yakit,
          kasa_tipi: form.kasa_tipi,
          km: parseInt(form.km) || 0,
          hasar_kaydi: form.hasar_kaydi,
          boyali_parca: form.boyali_parcalar.length,
          boyali_parcalar: form.boyali_parcalar,
          tramer_kaydi: form.tramer_kaydi,
          tramer_detay: form.tramer_detay.map((t) => ({ yil: parseInt(t.yil) || 0, tutar: parseFloat(t.tutar) || 0 })),
          agir_hasar_kaydi: form.agir_hasar_kaydi,
          fotograflar: form.foto_urls,
          fiyat: form.fiyat ? parseFloat(form.fiyat) : null,
          fiyat_gizle: form.fiyat_gizle,
          pazarlik_var: form.pazarlik_var,
          ozellikler: form.ozellikler,
          durum: form.durum,
          aciklama: form.aciklama,
        })
        .eq("id", id)
        .eq("user_id", user.id)

      if (error) throw error

      setBasarili(true)
      setTimeout(() => {
        router.push("/panel/araclar")
      }, 1500)
    } catch (err: any) {
      console.error(err)
      setHata(err.message || "Kaydederken bir hata oluştu.")
    } finally {
      setKaydediliyor(false)
    }
  }

  // Fotoğraf işlemleri
  const addFotoUrl = () => {
    if (yeniFotoUrl.trim() && yeniFotoUrl.startsWith("http")) {
      setForm((prev) => ({ ...prev, foto_urls: [...prev.foto_urls, yeniFotoUrl.trim()] }))
      setYeniFotoUrl("")
    }
  }

  const removeFoto = (index: number) => {
    setForm((prev) => ({ ...prev, foto_urls: prev.foto_urls.filter((_, i) => i !== index) }))
  }

  const makeCover = (index: number) => {
    if (index === 0) return
    setForm((prev) => {
      const urls = [...prev.foto_urls]
      const [target] = urls.splice(index, 1)
      urls.unshift(target)
      return { ...prev, foto_urls: urls }
    })
  }

  const moveFoto = (index: number, direction: "left" | "right") => {
    setForm((prev) => {
      const urls = [...prev.foto_urls]
      const targetIndex = direction === "left" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= urls.length) return prev
      const temp = urls[index]
      urls[index] = urls[targetIndex]
      urls[targetIndex] = temp
      return { ...prev, foto_urls: urls }
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files)
    }
  }

  const processFiles = async (files: FileList) => {
    if (!user) return
    setUploading(true)
    setHata("")
    const newUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const compressedBase64 = await compressImage(file)
        
        let uploadedUrl: string | null = null
        try {
          const blob = dataURLtoBlob(compressedBase64)
          const compressedFile = new File([blob], file.name, { type: "image/jpeg" })
          uploadedUrl = await uploadToSupabase(compressedFile, user.id)
        } catch (storageErr) {
          console.warn("Storage upload failed, fallback to base64", storageErr)
        }

        newUrls.push(uploadedUrl || compressedBase64)
      }
      setForm((prev) => ({ ...prev, foto_urls: [...prev.foto_urls, ...newUrls] }))
    } catch (err: any) {
      console.error(err)
      setHata("Görseller işlenirken hata oluştu.")
    } finally {
      setUploading(false)
    }
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let width = img.width, height = img.height
          const MAX_W = 1000, MAX_H = 1000
          if (width > MAX_W) { height *= MAX_W / width; width = MAX_W }
          if (height > MAX_H) { width *= MAX_H / height; height = MAX_H }
          canvas.width = width; canvas.height = height
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
      .upload(fileName, file, { contentType: "image/jpeg" })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from("araclar")
      .getPublicUrl(fileName)

    return publicUrl
  }

  const toggleOzellik = (oz: string) => {
    setForm((prev) => ({
      ...prev,
      ozellikler: prev.ozellikler.includes(oz)
        ? prev.ozellikler.filter((o) => o !== oz)
        : [...prev.ozellikler, oz],
    }))
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-af-bg">
        <PanelTopbar baslik="Araç Düzenle" />
        <main className="flex-1 p-6 flex justify-center items-center">
          <span className="w-10 h-10 border-4 border-af-accent/30 border-t-af-accent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-af-bg text-af-text">
      <PanelTopbar baslik="Araç Düzenle" aciklama={`${form.marka} ${form.model} güncellemesi`} />

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full pb-16 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/panel/araclar" className="w-10 h-10 rounded-xl bg-af-surface border border-af-border flex items-center justify-center text-af-text-secondary hover:text-white hover:border-af-accent/40 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="font-bold text-white text-base">Geri Dön</h2>
        </div>

        {basarili ? (
          <div className="bg-af-success/10 border border-af-success/20 text-af-success rounded-2xl p-8 text-center space-y-4 py-16">
            <Check className="w-16 h-16 mx-auto animate-bounce text-af-success" />
            <h3 className="text-xl font-black text-white">Araç Başarıyla Güncellendi!</h3>
            <p className="text-sm text-af-text-secondary">Yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {hata && (
              <div className="flex items-center gap-2.5 bg-af-error/10 border border-af-error/25 rounded-xl px-4 py-3 text-af-error text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {hata}
              </div>
            )}

            {/* Bölüm 1: Temel Bilgiler */}
            <div className="bg-af-surface border border-af-border rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base border-b border-af-border/60 pb-3">1. Temel Bilgiler</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Marka</label>
                  <select
                    value={form.marka}
                    onChange={(e) => setForm({ ...form, marka: e.target.value })}
                    required
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-3 py-2.5 text-af-text text-sm focus:outline-none focus:border-af-accent"
                  >
                    <option value="">Marka Seçin</option>
                    {MARKALAR.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Model</label>
                  <input
                    type="text"
                    required
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="örn: 320d, C200, Golf"
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-2.5 text-sm text-af-text focus:outline-none focus:border-af-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Yıl</label>
                  <input
                    type="number"
                    required
                    value={form.yil}
                    onChange={(e) => setForm({ ...form, yil: e.target.value })}
                    placeholder="örn: 2020"
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-2.5 text-sm text-af-text focus:outline-none focus:border-af-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Versiyon / Paket</label>
                  <input
                    type="text"
                    value={form.versiyon}
                    onChange={(e) => setForm({ ...form, versiyon: e.target.value })}
                    placeholder="örn: M Sport, AMG, Highline"
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-2.5 text-sm text-af-text focus:outline-none focus:border-af-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Renk</label>
                  <select
                    value={form.renk}
                    onChange={(e) => setForm({ ...form, renk: e.target.value })}
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-3 py-2.5 text-af-text text-sm focus:outline-none focus:border-af-accent"
                  >
                    <option value="">Renk Seçin</option>
                    {RENKLER.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bölüm 2: Teknik Özellikler */}
            <div className="bg-af-surface border border-af-border rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base border-b border-af-border/60 pb-3">2. Teknik Özellikler</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Vites Tipi</label>
                  <select
                    value={form.vites}
                    onChange={(e) => setForm({ ...form, vites: e.target.value })}
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-3 py-2.5 text-af-text text-sm focus:outline-none"
                  >
                    {VITESLER.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Yakıt Tipi</label>
                  <select
                    value={form.yakit}
                    onChange={(e) => setForm({ ...form, yakit: e.target.value })}
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-3 py-2.5 text-af-text text-sm focus:outline-none"
                  >
                    {YAKITLAR.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Kasa Tipi</label>
                  <select
                    value={form.kasa_tipi}
                    onChange={(e) => setForm({ ...form, kasa_tipi: e.target.value })}
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-3 py-2.5 text-af-text text-sm focus:outline-none"
                  >
                    {KASALAR.map((k) => (
                      <option key={k} value={k}>{k}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Kilometre (KM)</label>
                  <input
                    type="number"
                    required
                    value={form.km}
                    onChange={(e) => setForm({ ...form, km: e.target.value })}
                    placeholder="örn: 45000"
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-2.5 text-sm text-af-text focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Motor Hacmi (cc)</label>
                  <input
                    type="number"
                    value={form.motor_hacmi}
                    onChange={(e) => setForm({ ...form, motor_hacmi: e.target.value })}
                    placeholder="örn: 1995"
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-2.5 text-sm text-af-text focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Motor Gücü (HP)</label>
                  <input
                    type="number"
                    value={form.motor_gucu}
                    onChange={(e) => setForm({ ...form, motor_gucu: e.target.value })}
                    placeholder="örn: 190"
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-2.5 text-sm text-af-text focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Hasar Kaydı</label>
                  <div className="flex gap-3">
                    {[{ label: "Yok ✅", value: false }, { label: "Var ⚠️", value: true }].map((opt) => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, hasar_kaydi: opt.value }))}
                        className={cn(
                          "flex-1 py-2.5 rounded-xl text-sm border transition-all font-semibold",
                          form.hasar_kaydi === opt.value
                            ? "bg-af-accent border-af-accent text-white"
                            : "bg-af-surface-2 border-af-border text-af-text-secondary"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">
                    Boyalı Parçalar {form.boyali_parcalar.length > 0 ? `(${form.boyali_parcalar.length} parça)` : ""}
                  </label>
                  <div className="bg-af-surface-2/40 rounded-2xl border border-af-border p-4">
                    <ArabaKrokisi
                      boyaliParcalar={form.boyali_parcalar}
                      onChange={(parcalar) => setForm((prev) => ({ ...prev, boyali_parcalar: parcalar }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bölüm: Hasar & Tramer Geçmişi */}
            <div className="bg-af-surface border border-af-border rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base border-b border-af-border/60 pb-3">Hasar & Tramer Geçmişi</h3>

              {/* Tramer Kaydı Var/Yok */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-af-text-secondary">Tramer Kaydı Var mı?</label>
                <div className="flex gap-3">
                  {[{ label: "Tramer Kaydı Yok ✅", value: false }, { label: "Tramer Kaydı Var ⚠️", value: true }].map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, tramer_kaydi: opt.value }))}
                      className={cn(
                        "flex-1 py-2.5 rounded-xl text-sm border transition-all font-semibold",
                        form.tramer_kaydi === opt.value
                          ? "bg-af-accent border-af-accent text-white"
                          : "bg-af-surface-2 border-af-border text-af-text-secondary"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tramer Detay Girişleri */}
              {form.tramer_kaydi && (
                <div className="space-y-3 bg-af-surface-2/40 p-4 rounded-xl border border-af-border">
                  <p className="text-xs font-semibold text-af-text-secondary">Tramer Kayıtları</p>
                  
                  {form.tramer_detay.length > 0 && (
                    <div className="space-y-2">
                      {form.tramer_detay.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-af-surface-2 px-3 py-2 rounded-lg border border-af-border text-xs">
                          <div>
                            <span className="font-bold text-white">{item.yil} Yılı: </span>
                            <span className="text-af-success font-semibold">₺{Number(item.tutar).toLocaleString("tr-TR")}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, tramer_detay: prev.tramer_detay.filter((_, i) => i !== idx) }))}
                            className="text-af-error hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <input
                      type="number"
                      placeholder="Yıl (örn. 2022)"
                      value={yeniTramer.yil}
                      onChange={(e) => setYeniTramer({ ...yeniTramer, yil: e.target.value })}
                      className="bg-af-surface border border-af-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                    <input
                      type="number"
                      placeholder="Tutar (₺)"
                      value={yeniTramer.tutar}
                      onChange={(e) => setYeniTramer({ ...yeniTramer, tutar: e.target.value })}
                      className="bg-af-surface border border-af-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (yeniTramer.yil && yeniTramer.tutar) {
                        setForm((prev) => ({ ...prev, tramer_detay: [...prev.tramer_detay, yeniTramer] }))
                        setYeniTramer({ yil: "", tutar: "" })
                      }
                    }}
                    className="w-full bg-af-surface-2 hover:bg-af-surface border border-af-border text-xs text-white font-semibold py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tramer Kaydı Ekle
                  </button>
                </div>
              )}

              {/* Ağır Hasar Kaydı */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-af-surface-2/40 border border-af-border rounded-xl">
                  <input
                    type="checkbox"
                    checked={form.agir_hasar_kaydi}
                    onChange={(e) => setForm((prev) => ({ ...prev, agir_hasar_kaydi: e.target.checked }))}
                    className="w-4 h-4 rounded text-af-accent bg-af-surface border-af-border focus:ring-af-accent"
                  />
                  <div>
                    <p className="text-xs font-bold text-white">Ağır Hasar / Pert Kaydı Var</p>
                    <p className="text-[10px] text-af-text-disabled">Araç ağır hasarlı veya pert kayıtlıysa işaretleyin</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Bölüm 3: Fotoğraflar */}
            <div className="bg-af-surface border border-af-border rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base border-b border-af-border/60 pb-3">3. Fotoğraflar</h3>

              <div className="flex gap-2 border-b border-af-border/30 pb-2">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={cn("px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    uploadMode === "file" ? "bg-af-accent text-white" : "text-af-text-disabled"
                  )}
                >
                  Dosya Yükle
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("url")}
                  className={cn("px-4 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    uploadMode === "url" ? "bg-af-accent text-white" : "text-af-text-disabled"
                  )}
                >
                  URL ile Ekle
                </button>
              </div>

              {uploadMode === "file" ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("edit-file-input")?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-af-surface-2/20 flex flex-col items-center justify-center",
                    isDragging ? "border-af-accent bg-af-accent/5" : "border-af-border hover:border-af-accent/40"
                  )}
                >
                  <input
                    id="edit-file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-af-text-disabled mb-3" />
                  <p className="text-sm text-white font-bold mb-1">Görselleri sürükleyip bırakın veya tıklayın</p>
                  <p className="text-xs text-af-text-disabled">PNG, JPG, WEBP formatları</p>
                  {uploading && <Loader2 className="w-5 h-5 animate-spin text-af-accent mt-3" />}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={yeniFotoUrl}
                    onChange={(e) => setYeniFotoUrl(e.target.value)}
                    placeholder="Görsel URL adresi (https://...)"
                    className="flex-1 bg-af-surface-2 border border-af-border rounded-xl px-4 py-2.5 text-sm text-af-text focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addFotoUrl}
                    className="bg-af-accent hover:bg-af-accent-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Ekle
                  </button>
                </div>
              )}

              {/* Eklenen Görseller */}
              {form.foto_urls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {form.foto_urls.map((url, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-af-border bg-af-surface-2 group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {i === 0 && (
                        <span className="absolute top-2 left-2 text-[10px] bg-af-accent text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider shadow-md z-10">Kapak</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFoto(i)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 hover:bg-af-error text-white flex items-center justify-center transition-colors shadow-lg z-10"
                        title="Görseli Sil"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Hover Controls */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-2 flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                        <div className="flex gap-1">
                          {i > 0 && (
                            <button
                              type="button"
                              onClick={() => moveFoto(i, "left")}
                              className="w-6 h-6 rounded bg-black/60 hover:bg-af-accent text-white flex items-center justify-center transition-colors"
                              title="Sola Taşı"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}
                          {i < form.foto_urls.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveFoto(i, "right")}
                              className="w-6 h-6 rounded bg-black/60 hover:bg-af-accent text-white flex items-center justify-center transition-colors"
                              title="Sağa Taşı"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {i > 0 && (
                          <button
                            type="button"
                            onClick={() => makeCover(i)}
                            className="text-[9px] bg-black/60 hover:bg-af-accent text-white px-2 py-1 rounded font-bold transition-colors uppercase tracking-wider"
                          >
                            Kapak Yap
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bölüm 4: Donanımlar */}
            <div className="bg-af-surface border border-af-border rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base border-b border-af-border/60 pb-3">4. Donanımlar</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {POPULER_OZELLIKLER.map((oz) => {
                  const secili = form.ozellikler.includes(oz)
                  return (
                    <button
                      key={oz}
                      type="button"
                      onClick={() => toggleOzellik(oz)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs transition-all",
                        secili
                          ? "bg-af-accent/10 border-af-accent/50 text-af-accent font-semibold"
                          : "bg-af-surface-2 border-af-border text-af-text-secondary hover:border-af-border-light"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-all",
                        secili ? "bg-af-accent border-af-accent" : "border-af-text-disabled"
                      )}>
                        {secili && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {oz}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bölüm 5: Fiyat & Durum */}
            <div className="bg-af-surface border border-af-border rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base border-b border-af-border/60 pb-3">5. Fiyat & Satış Durumu</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">Fiyat (TL)</label>
                  <input
                    type="number"
                    value={form.fiyat}
                    onChange={(e) => setForm({ ...form, fiyat: e.target.value })}
                    placeholder="örn: 1550000"
                    disabled={form.fiyat_gizle}
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-2.5 text-sm text-af-text focus:outline-none disabled:opacity-40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-af-text-secondary">İlan Durumu</label>
                  <select
                    value={form.durum}
                    onChange={(e) => setForm({ ...form, durum: e.target.value as any })}
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-3 py-2.5 text-af-text text-sm focus:outline-none"
                  >
                    <option value="Aktif">Aktif (Satışta)</option>
                    <option value="Satildi">Satıldı</option>
                    <option value="Pasif">Pasif (Arşiv)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.fiyat_gizle}
                    onChange={(e) => setForm({ ...form, fiyat_gizle: e.target.checked })}
                    className="w-4 h-4 rounded text-af-accent bg-af-surface-2 border-af-border"
                  />
                  <span className="text-sm font-medium text-white">Fiyatı Gizle (Teklif Alın)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.pazarlik_var}
                    onChange={(e) => setForm({ ...form, pazarlik_var: e.target.checked })}
                    className="w-4 h-4 rounded text-af-accent bg-af-surface-2 border-af-border"
                  />
                  <span className="text-sm font-medium text-white">Pazarlık Payı Var</span>
                </label>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-sm font-medium text-af-text-secondary">Araç Açıklaması</label>
                <textarea
                  value={form.aciklama}
                  onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                  placeholder="Araç hakkında detaylı açıklama yazın... (Örn: Kazasız, boyasız, bakımları yeni yapılmıştır.)"
                  className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-2.5 text-sm text-af-text focus:outline-none h-28 resize-none"
                />
              </div>
            </div>

            {/* Kaydet butonu */}
            <button
              type="submit"
              disabled={kaydediliyor}
              className="w-full bg-af-accent hover:bg-af-accent-hover disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-af-accent/25 flex items-center justify-center gap-2 text-sm"
            >
              {kaydediliyor ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
              ) : (
                <><Save className="w-4 h-4" /> Değişiklikleri Kaydet</>
              )}
            </button>

          </form>
        )}
      </main>
    </div>
  )
}
