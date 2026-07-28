"use client"

import { useState } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import { Check, ChevronRight, Upload, Plus, X, AlertCircle, Loader2, Image as ImageIcon, Link as LinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

const ADIMLAR = [
  { id: 1, baslik: "Temel Bilgiler", aciklama: "Marka, model, yıl" },
  { id: 2, baslik: "Teknik Bilgiler", aciklama: "Motor, vites, yakıt" },
  { id: 3, baslik: "Fotoğraflar", aciklama: "Görsel yükle" },
  { id: 4, baslik: "Fiyat & Durum", aciklama: "Fiyat belirle" },
  { id: 5, baslik: "Özet", aciklama: "Gözden geçir & kaydet" },
]

const MARKALAR = ["BMW", "Mercedes-Benz", "Audi", "Toyota", "Volkswagen", "Ford", "Renault", "Peugeot", "Hyundai", "Kia", "Honda", "Volvo", "Land Rover", "Porsche", "Ferrari", "Lamborghini"]
const KASALAR = ["Sedan", "Hatchback", "SUV", "Coupe", "Pickup", "Cabrio", "Station Wagon", "Minivan"]
const VITESLER = ["Manuel", "Otomatik", "Yarı-Otomatik"]
const YAKITLAR = ["Benzin", "Dizel", "Elektrik", "Hybrid", "LPG"]
const RENKLER = ["Beyaz", "Siyah", "Gümüş", "Gri", "Kırmızı", "Mavi", "Lacivert", "Yeşil", "Sarı", "Turuncu", "Kahverengi", "Bordo"]

interface FormData {
  marka: string
  model: string
  yil: string
  versiyon: string
  renk: string
  motor_hacmi: string
  motor_gucu: string
  vites: string
  yakit: string
  kasa_tipi: string
  km: string
  hasar_kaydi: boolean
  boyali_parca: string
  foto_urls: string[]
  fiyat: string
  fiyat_gizle: boolean
  pazarlik_var: boolean
  ozellikler: string[]
}

const initialForm: FormData = {
  marka: "", model: "", yil: String(new Date().getFullYear()),
  versiyon: "", renk: "",
  motor_hacmi: "", motor_gucu: "",
  vites: "Otomatik", yakit: "Benzin", kasa_tipi: "Sedan",
  km: "", hasar_kaydi: false, boyali_parca: "0",
  foto_urls: [],
  fiyat: "", fiyat_gizle: false, pazarlik_var: false,
  ozellikler: [],
}

const POPULER_OZELLIKLER = [
  "Isıtmalı Koltuklar", "Sunroof / Panoramik Tavan", "Geri Görüş Kamerası",
  "Apple CarPlay / Android Auto", "Navigasyon", "LED Farlar",
  "Park Sensörü", "Keyless Go / Keyless Entry", "Deri Döşeme",
  "Şerit Takip Sistemi", "Adaptif Hız Sabitleyici", "Wireless Şarj",
  "360° Kamera", "Ventilasyonlu Koltuklar", "Head-Up Display",
]

function SelectBtn({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1.5 rounded-xl text-sm border transition-all",
            value === opt
              ? "bg-af-accent border-af-accent text-white font-semibold"
              : "bg-af-surface-2 border-af-border text-af-text-secondary hover:border-af-border-light hover:text-white"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

function FormField({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-af-text-secondary">
        {label} {required && <span className="text-af-error">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = "w-full bg-af-surface border border-af-border text-af-text placeholder:text-af-text-disabled rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-af-accent transition-colors"

export default function YeniAracPage() {
  const { user } = useAuth()
  const supabase = createClient()

  const [aktifAdim, setAktifAdim] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [tamam, setTamam] = useState(false)
  const [yeniFotoUrl, setYeniFotoUrl] = useState("")
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState("")
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file")
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

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
    if (!user) {
      setHata("Fotoğraf yüklemek için giriş yapmış olmalısınız.")
      return
    }

    setUploading(true)
    setHata("")
    const newUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        // Compress the image client-side to keep size small (~80KB)
        const compressedBase64 = await compressImage(file)
        
        // Try uploading to Supabase Storage if possible
        let uploadedUrl: string | null = null
        try {
          const blob = dataURLtoBlob(compressedBase64)
          const compressedFile = new File([blob], file.name, { type: "image/jpeg" })
          uploadedUrl = await uploadToSupabase(compressedFile, user.id)
        } catch (storageErr) {
          console.warn("Storage upload process error, falling back to base64:", storageErr)
        }

        if (uploadedUrl) {
          newUrls.push(uploadedUrl)
        } else {
          newUrls.push(compressedBase64)
        }
      }

      if (newUrls.length > 0) {
        update("foto_urls", [...form.foto_urls, ...newUrls])
      }
    } catch (err: any) {
      console.error("Görsel işleme hatası:", err)
      setHata("Görseller işlenirken bir hata oluştu: " + (err.message || err))
    } finally {
      setUploading(false)
    }
  }

  const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
    const bstr = atob(arr[arr.length - 1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new window.Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const maxWidth = 1024
          const maxHeight = 1024
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width)
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height)
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Canvas context could not be created"))
            return
          }

          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7)
          resolve(dataUrl)
        }
        img.onerror = (err) => reject(err)
      }
      reader.onerror = (err) => reject(err)
    })
  }

  const uploadToSupabase = async (file: File, userId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg'
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('araclar')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.warn("Storage upload failed (expected if bucket not setup):", error.message)
        return null
      }

      const { data: { publicUrl } } = supabase.storage
        .from('araclar')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (err) {
      console.warn("Storage upload error:", err)
      return null
    }
  }

  const update = (key: keyof FormData, value: FormData[keyof FormData]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggleOzellik = (oz: string) =>
    setForm((f) => ({
      ...f,
      ozellikler: f.ozellikler.includes(oz)
        ? f.ozellikler.filter((o) => o !== oz)
        : [...f.ozellikler, oz],
    }))

  const addFoto = () => {
    if (yeniFotoUrl.trim()) {
      update("foto_urls", [...form.foto_urls, yeniFotoUrl.trim()])
      setYeniFotoUrl("")
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      setHata("Oturum açmış olmanız gerekmektedir.")
      return
    }

    if (!form.marka || !form.model || !form.yil) {
      setHata("Lütfen zorunlu alanları doldurun (Marka, Model, Yıl).")
      return
    }

    setKaydediliyor(true)
    setHata("")

    try {
      // Abonelik Planı & Limit Kontrolü
      const { data: profile } = await supabase
        .from("galeri_profilleri")
        .select("plan")
        .eq("user_id", user.id)
        .single()

      const userPlan = profile?.plan || "Essential"

      if (userPlan === "Professional") {
        const { count, error: countErr } = await supabase
          .from("araclar")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)

        if (!countErr && count !== null && count >= 10) {
          throw new Error("Abonelik Limit Aşımı: Professional planınız kapsamında maksimum 10 araç ekleyebilirsiniz. Elite plana geçmek için yönetici ile iletişime geçin.")
        }
      }

      // Benzersiz bir qr_slug üret (örn: af-491295)
      const randomId = Math.floor(100000 + Math.random() * 900000)
      const qrSlug = `af-${randomId}`

      const { error } = await supabase.from("araclar").insert({
        user_id: user.id,
        qr_slug: qrSlug,
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
        km: form.km ? parseInt(form.km) : 0,
        hasar_kaydi: form.hasar_kaydi,
        boyali_parca: form.boyali_parca ? parseInt(form.boyali_parca) : 0,
        fotograflar: form.foto_urls.length > 0 ? form.foto_urls : ["/placeholder-car.png"],
        fiyat: form.fiyat ? parseFloat(form.fiyat) : null,
        fiyat_gizle: form.fiyat_gizle,
        pazarlik_var: form.pazarlik_var,
        ozellikler: form.ozellikler,
        durum: "Aktif",
      })

      if (error) throw error

      setTamam(true)
    } catch (err: any) {
      console.error("Araç eklenirken hata oluştu:", err)
      setHata(err.message || "Araç kaydedilemedi. Lütfen tekrar deneyin.")
    } finally {
      setKaydediliyor(false)
    }
  }

  if (tamam) {
    return (
      <div className="flex flex-col min-h-screen bg-af-bg text-af-text">
        <PanelTopbar baslik="Araç Ekle" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-af-success flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-af-success/20">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-af-text mb-2">Araç Eklendi!</h2>
            <p className="text-af-text-secondary mb-6">
              {form.marka} {form.model} başarıyla eklendi. QR kodu otomatik oluşturuldu.
            </p>
            <div className="flex gap-3 justify-center">
              <a href="/panel/araclar" className="bg-af-accent hover:bg-af-accent-hover text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
                Araç Listesi
              </a>
              <button
                onClick={() => { setTamam(false); setForm(initialForm); setAktifAdim(1) }}
                className="bg-af-surface hover:bg-af-surface-2 text-af-text-secondary font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
              >
                Yeni Araç Ekle
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-af-bg text-af-text">
      <PanelTopbar baslik="Yeni Araç Ekle" aciklama="Adım adım ilerleyin" />

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        {/* STEPPER */}
        <div className="flex items-center gap-0 mb-8 overflow-x-auto pb-2">
          {ADIMLAR.map((adim, idx) => (
            <div key={adim.id} className="flex items-center flex-shrink-0">
              <button
                type="button"
                onClick={() => aktifAdim > adim.id && setAktifAdim(adim.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-sm",
                  aktifAdim === adim.id
                    ? "bg-af-accent text-white font-semibold"
                    : aktifAdim > adim.id
                    ? "text-af-success cursor-pointer hover:bg-af-success/10"
                    : "text-af-text-disabled cursor-default"
                )}
              >
                <span className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                  aktifAdim === adim.id ? "bg-white/20" :
                  aktifAdim > adim.id ? "bg-af-success text-white" :
                  "bg-af-surface text-af-text-disabled"
                )}>
                  {aktifAdim > adim.id ? <Check className="w-3.5 h-3.5" /> : adim.id}
                </span>
                <span className="hidden sm:inline">{adim.baslik}</span>
              </button>
              {idx < ADIMLAR.length - 1 && (
                <div className={cn("w-6 h-px mx-1", aktifAdim > adim.id ? "bg-af-success/30" : "bg-af-border")} />
              )}
            </div>
          ))}
        </div>

        {/* FORM ADIMI */}
        <div className="bg-af-surface rounded-2xl border border-af-border p-6">
          <h2 className="text-lg font-bold text-af-text mb-1">{ADIMLAR[aktifAdim - 1].baslik}</h2>
          <p className="text-af-text-secondary text-sm mb-6">{ADIMLAR[aktifAdim - 1].aciklama}</p>

          {/* ADIM 1: Temel Bilgiler */}
          {aktifAdim === 1 && (
            <div className="space-y-5">
              <FormField label="Marka" required>
                <div className="flex flex-wrap gap-2">
                  {MARKALAR.map((m) => (
                    <button key={m} type="button" onClick={() => update("marka", m)}
                      className={cn("px-3 py-1.5 rounded-xl text-sm border transition-all",
                        form.marka === m ? "bg-af-accent border-af-accent text-white font-semibold" : "bg-af-surface-2 border-af-border text-af-text-secondary hover:border-af-border-light hover:text-white"
                      )}>{m}</button>
                  ))}
                </div>
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Model" required>
                  <input className={inputClass} placeholder="ör. 3 Serisi" value={form.model} onChange={(e) => update("model", e.target.value)} />
                </FormField>
                <FormField label="Yıl" required>
                  <input className={inputClass} type="number" min="1990" max="2030" value={form.yil} onChange={(e) => update("yil", e.target.value)} />
                </FormField>
              </div>
              <FormField label="Versiyon / Donanım">
                <input className={inputClass} placeholder="ör. 320i M Sport" value={form.versiyon} onChange={(e) => update("versiyon", e.target.value)} />
              </FormField>
              <FormField label="Renk">
                <SelectBtn value={form.renk} options={RENKLER} onChange={(v) => update("renk", v)} />
              </FormField>
            </div>
          )}

          {/* ADIM 2: Teknik */}
          {aktifAdim === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Motor Hacmi (cc)">
                  <input className={inputClass} type="number" placeholder="ör. 1998" value={form.motor_hacmi} onChange={(e) => update("motor_hacmi", e.target.value)} />
                </FormField>
                <FormField label="Motor Gücü (HP)">
                  <input className={inputClass} type="number" placeholder="ör. 184" value={form.motor_gucu} onChange={(e) => update("motor_gucu", e.target.value)} />
                </FormField>
              </div>
              <FormField label="Vites" required>
                <SelectBtn value={form.vites} options={VITESLER} onChange={(v) => update("vites", v)} />
              </FormField>
              <FormField label="Yakıt" required>
                <SelectBtn value={form.yakit} options={YAKITLAR} onChange={(v) => update("yakit", v)} />
              </FormField>
              <FormField label="Kasa Tipi" required>
                <SelectBtn value={form.kasa_tipi} options={KASALAR} onChange={(v) => update("kasa_tipi", v)} />
              </FormField>
              <FormField label="Kilometre" required>
                <input className={inputClass} type="number" placeholder="ör. 12500" value={form.km} onChange={(e) => update("km", e.target.value)} />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Hasar Kaydı">
                  <div className="flex gap-3">
                    {[{ label: "Yok ✅", value: false }, { label: "Var ⚠️", value: true }].map((opt) => (
                      <button key={String(opt.value)} type="button"
                        onClick={() => update("hasar_kaydi", opt.value)}
                        className={cn("flex-1 py-2 rounded-xl text-sm border transition-all",
                          form.hasar_kaydi === opt.value ? "bg-af-accent border-af-accent text-white font-semibold" : "bg-af-surface-2 border-af-border text-af-text-secondary"
                        )}>{opt.label}</button>
                    ))}
                  </div>
                </FormField>
                <FormField label="Boyalı Parça Sayısı">
                  <input className={inputClass} type="number" min="0" value={form.boyali_parca} onChange={(e) => update("boyali_parca", e.target.value)} />
                </FormField>
              </div>
              <FormField label="Donanımlar">
                <div className="flex flex-wrap gap-2">
                  {POPULER_OZELLIKLER.map((oz) => (
                    <button key={oz} type="button" onClick={() => toggleOzellik(oz)}
                      className={cn("px-3 py-1.5 rounded-xl text-xs border transition-all",
                        form.ozellikler.includes(oz) ? "bg-af-accent border-af-accent text-white" : "bg-af-surface-2 border-af-border text-af-text-secondary hover:border-af-border-light"
                      )}>{oz}</button>
                  ))}
                </div>
              </FormField>
            </div>
          )}

          {/* ADIM 3: Fotoğraflar */}
          {aktifAdim === 3 && (
            <div className="space-y-5">
              <p className="text-af-text-secondary text-sm">Fotoğraf ekleyin. İlk fotoğraf kapak görseli olarak kullanılır.</p>
              
              {/* Sekme Seçici */}
              <div className="flex gap-2 p-1 bg-af-surface-2 rounded-xl border border-af-border">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={cn(
                    "flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2",
                    uploadMode === "file"
                      ? "bg-af-accent text-white shadow-sm"
                      : "text-af-text-secondary hover:text-white"
                  )}
                >
                  <Upload className="w-4 h-4" /> Cihazdan Yükle
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("url")}
                  className={cn(
                    "flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2",
                    uploadMode === "url"
                      ? "bg-af-accent text-white shadow-sm"
                      : "text-af-text-secondary hover:text-white"
                  )}
                >
                  <LinkIcon className="w-4 h-4" /> URL ile Ekle
                </button>
              </div>

              {uploadMode === "file" ? (
                <div className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[180px]",
                      isDragging
                        ? "border-af-accent bg-af-accent/10"
                        : "border-af-border hover:border-af-border-light bg-af-surface-2/30",
                      uploading && "opacity-60 cursor-not-allowed"
                    )}
                    onClick={() => !uploading && document.getElementById("file-upload")?.click()}
                  >
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    {uploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-af-accent animate-spin" />
                        <p className="text-af-text-secondary text-sm font-medium">Fotoğraflar sıkıştırılıyor ve yükleniyor...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-af-surface-2 border border-af-border flex items-center justify-center mb-3">
                          <ImageIcon className="w-6 h-6 text-af-text-secondary" />
                        </div>
                        <p className="text-af-text text-sm font-bold">Fotoğrafları buraya sürükleyin veya cihazınızdan seçin</p>
                        <p className="text-af-text-disabled text-xs mt-1">JPEG, PNG veya WEBP. Birden fazla seçebilirsiniz.</p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    className={cn(inputClass, "flex-1")}
                    placeholder="https://... (fotoğraf URL'i)"
                    value={yeniFotoUrl}
                    onChange={(e) => setYeniFotoUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addFoto()}
                  />
                  <button onClick={addFoto} type="button"
                    className="bg-af-accent hover:bg-af-accent-hover text-white px-4 rounded-xl transition-colors flex items-center gap-1.5 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" /> Ekle
                  </button>
                </div>
              )}

              {form.foto_urls.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-xs text-af-text-disabled uppercase tracking-wider font-semibold">Eklenen Fotoğraflar ({form.foto_urls.length})</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {form.foto_urls.map((url, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden bg-af-surface-2 border border-af-border" style={{ aspectRatio: "16/10" }}>
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <span className="absolute top-2 left-2 text-xs bg-af-accent text-white px-2 py-0.5 rounded-full font-bold shadow-md">Kapak</span>
                        )}
                        <button
                          type="button"
                          onClick={() => update("foto_urls", form.foto_urls.filter((_, idx) => idx !== i))}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-af-error hover:bg-af-error/90 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.foto_urls.length === 0 && !uploading && (
                <div className="border border-af-border bg-af-surface-2/20 rounded-2xl p-8 text-center">
                  <Upload className="w-8 h-8 text-af-text-disabled mx-auto mb-3" />
                  <p className="text-af-text-secondary text-sm">Henüz fotoğraf eklenmedi</p>
                  <p className="text-af-text-disabled text-xs mt-1">Cihazınızdan seçerek veya URL girerek başlayın</p>
                </div>
              )}
            </div>
          )}

          {/* ADIM 4: Fiyat */}
          {aktifAdim === 4 && (
            <div className="space-y-5">
              <FormField label="Satış Fiyatı (₺)">
                <input
                  className={inputClass}
                  type="number"
                  placeholder="ör. 1500000"
                  value={form.fiyat}
                  onChange={(e) => update("fiyat", e.target.value)}
                  disabled={form.fiyat_gizle}
                />
              </FormField>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 bg-af-surface-2 rounded-xl border border-af-border cursor-pointer hover:border-af-accent transition-colors">
                  <input
                    type="checkbox"
                    checked={form.fiyat_gizle}
                    onChange={(e) => update("fiyat_gizle", e.target.checked)}
                    className="w-4 h-4 rounded accent-af-accent"
                  />
                  <div>
                    <p className="text-af-text text-sm font-medium">Fiyatı Gizle</p>
                    <p className="text-af-text-secondary text-xs">Müşterilere "Fiyat için arayın" gösterilir</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-af-surface-2 rounded-xl border border-af-border cursor-pointer hover:border-af-accent transition-colors">
                  <input
                    type="checkbox"
                    checked={form.pazarlik_var}
                    onChange={(e) => update("pazarlik_var", e.target.checked)}
                    className="w-4 h-4 rounded accent-af-accent"
                  />
                  <div>
                    <p className="text-af-text text-sm font-medium">Pazarlığa Açık</p>
                    <p className="text-af-text-secondary text-xs">Araç detay sayfasında belirtilir</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* ADIM 5: Özet */}
          {aktifAdim === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Marka", value: form.marka || "—" },
                  { label: "Model", value: form.model || "—" },
                  { label: "Yıl", value: form.yil },
                  { label: "Vites", value: form.vites },
                  { label: "Yakıt", value: form.yakit },
                  { label: "Km", value: form.km ? `${Number(form.km).toLocaleString("tr-TR")} km` : "—" },
                  { label: "Fiyat", value: form.fiyat_gizle ? "Gizli" : form.fiyat ? `₺${Number(form.fiyat).toLocaleString("tr-TR")}` : "—" },
                  { label: "Hasar", value: form.hasar_kaydi ? "Var" : "Yok" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-af-surface-2 rounded-xl p-3">
                    <p className="text-af-text-secondary text-xs mb-0.5">{label}</p>
                    <p className="text-af-text text-sm font-semibold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-af-surface-2 rounded-xl p-3">
                <p className="text-af-text-secondary text-xs mb-1">Fotoğraf</p>
                <p className="text-af-text text-sm font-semibold">{form.foto_urls.length} adet fotoğraf</p>
              </div>
              <div className="bg-af-surface-2 rounded-xl p-3">
                <p className="text-af-text-secondary text-xs mb-1">Donanımlar</p>
                <p className="text-af-text text-sm font-semibold">{form.ozellikler.length} özellik seçildi</p>
              </div>

              {hata && (
                <div className="flex items-center gap-2.5 bg-af-error/10 border border-af-error/25 rounded-xl px-4 py-3 text-sm text-af-error">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>{hata}</p>
                </div>
              )}

              <div className="mt-4 p-4 bg-af-accent/10 border border-af-accent/20 rounded-xl">
                <p className="text-af-accent text-sm font-medium">✓ QR kodu otomatik oluşturulacak</p>
                <p className="text-af-text-secondary text-xs mt-0.5">Araç kaydedildikten sonra QR Kodlar sayfasından indirebilirsiniz</p>
              </div>
            </div>
          )}
        </div>

        {/* NAVİGASYON BUTONLARI */}
        <div className="flex items-center justify-between mt-5">
          <button
            type="button"
            onClick={() => setAktifAdim((s) => Math.max(1, s - 1))}
            disabled={aktifAdim === 1 || kaydediliyor}
            className="px-5 py-2.5 text-af-text-secondary hover:text-white border border-af-border hover:border-af-border-light rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Geri
          </button>

          {aktifAdim < ADIMLAR.length ? (
            <button
              type="button"
              onClick={() => setAktifAdim((s) => Math.min(ADIMLAR.length, s + 1))}
              className="flex items-center gap-2 bg-af-accent hover:bg-af-accent-hover text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg"
            >
              İleri <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={kaydediliyor}
              className="flex items-center gap-2 bg-af-success hover:bg-af-success/90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {kaydediliyor ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Aracı Kaydet
                </>
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
