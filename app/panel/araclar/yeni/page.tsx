"use client"

import { useState } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import { Check, ChevronRight, Upload, Plus, X, AlertCircle, Loader2, Image as ImageIcon, Link as LinkIcon, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { ArabaKrokisi } from "@/components/autoflow/araba-krokisi"
import { getVehicleLimit, normalizePlan } from "@/lib/plans"
import html2canvas from "html2canvas"

const ADIMLAR = [
  { id: 1, baslik: "Temel Bilgiler", aciklama: "Marka, model, yıl" },
  { id: 2, baslik: "Teknik Bilgiler", aciklama: "Motor, vites, yakıt" },
  { id: 3, baslik: "Fotoğraflar", aciklama: "Görsel yükle" },
  { id: 4, baslik: "Hasar Geçmişi", aciklama: "Tramer & ağır hasar" },
  { id: 5, baslik: "Fiyat & Durum", aciklama: "Fiyat belirle" },
  { id: 6, baslik: "Özet", aciklama: "Gözden geçir & kaydet" },
]

const MARKALAR = ["BMW", "Mercedes-Benz", "Audi", "Toyota", "Volkswagen", "Ford", "Renault", "Peugeot", "Hyundai", "Kia", "Honda", "Volvo", "Land Rover", "Porsche", "Ferrari", "Lamborghini"]
const KASALAR = ["Sedan", "Hatchback", "SUV", "Coupe", "Pickup", "Cabrio", "Station Wagon", "Minivan"]
const VITESLER = ["Manuel", "Otomatik", "Yarı-Otomatik"]
const YAKITLAR = ["Benzin", "Dizel", "Elektrik", "Hybrid", "LPG"]
const RENKLER = ["Beyaz", "Siyah", "Gümüş", "Gri", "Kırmızı", "Mavi", "Lacivert", "Yeşil", "Sarı", "Turuncu", "Kahverengi", "Bordo"]

interface TramerKayit {
  yil: string
  tutar: string
}

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
  boyali_parcalar: string[]
  tramer_kaydi: boolean
  tramer_detay: TramerKayit[]
  agir_hasar_kaydi: boolean
  foto_urls: string[]
  fiyat: string
  fiyat_gizle: boolean
  pazarlik_var: boolean
  ozellikler: string[]
  aciklama: string
}

const initialForm: FormData = {
  marka: "", model: "", yil: String(new Date().getFullYear()),
  versiyon: "", renk: "",
  motor_hacmi: "", motor_gucu: "",
  vites: "Otomatik", yakit: "Benzin", kasa_tipi: "Sedan",
  km: "", hasar_kaydi: false, boyali_parcalar: [],
  tramer_kaydi: false, tramer_detay: [], agir_hasar_kaydi: false,
  foto_urls: [],
  fiyat: "", fiyat_gizle: false, pazarlik_var: false,
  ozellikler: [],
  aciklama: "",
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
  const [kaydedilenSlug, setKaydedilenSlug] = useState("")
  const [galeriAdi, setGaleriAdi] = useState("")
  const [yeniFotoUrl, setYeniFotoUrl] = useState("")
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [hata, setHata] = useState("")
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file")
  const [uploading, setUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [yeniTramer, setYeniTramer] = useState<TramerKayit>({ yil: "", tutar: "" })

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
        
        const blob = dataURLtoBlob(compressedBase64)
        const compressedFile = new File([blob], file.name, { type: "image/jpeg" })
        const uploadedUrl = await uploadToSupabase(compressedFile, user.id)
        newUrls.push(uploadedUrl)
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

  const uploadToSupabase = async (file: File, userId: string): Promise<string> => {
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`
    const { error } = await supabase.storage
      .from('araclar')
      .upload(fileName, file, {
        contentType: "image/jpeg",
        cacheControl: '31536000',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('araclar')
      .getPublicUrl(fileName)

    return publicUrl
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
        .select("plan, galeri_adi")
        .eq("user_id", user.id)
        .single()

      const userPlan = normalizePlan(profile?.plan)
      if (profile?.galeri_adi) setGaleriAdi(profile.galeri_adi)

      const vehicleLimit = getVehicleLimit(userPlan)
      if (vehicleLimit !== null) {
        const { count, error: countErr } = await supabase
          .from("araclar")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)

        if (!countErr && count !== null && count >= vehicleLimit) {
          const planLabel = userPlan === "Essential" ? "Ücretsiz" : "Professional"
          throw new Error(
            `${planLabel} planda maksimum ${vehicleLimit} araç ekleyebilirsiniz. Daha fazla araç için bir üst plana geçin.`
          )
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
        boyali_parca: form.boyali_parcalar.length,
        boyali_parcalar: form.boyali_parcalar,
        tramer_kaydi: form.tramer_kaydi,
        tramer_detay: form.tramer_detay.map((t) => ({ yil: parseInt(t.yil), tutar: parseFloat(t.tutar) })),
        agir_hasar_kaydi: form.agir_hasar_kaydi,
        fotograflar: form.foto_urls.length > 0 ? form.foto_urls : ["/placeholder.jpg"],
        fiyat: form.fiyat ? parseFloat(form.fiyat) : null,
        fiyat_gizle: form.fiyat_gizle,
        pazarlik_var: form.pazarlik_var,
        ozellikler: form.ozellikler,
        aciklama: form.aciklama,
        durum: "Aktif",
      })

      if (error) throw error

      setKaydedilenSlug(qrSlug)
      setTamam(true)
    } catch (err: any) {
      console.error("Araç eklenirken hata oluştu:", err)
      setHata(err.message || "Araç kaydedilemedi. Lütfen tekrar deneyin.")
    } finally {
      setKaydediliyor(false)
    }
  }

  if (tamam) {
    const aracAdi = `${form.yil} ${form.marka} ${form.model}${form.versiyon ? ` ${form.versiyon}` : ""}`
    const qrUrl = typeof window !== "undefined" ? `${window.location.origin}/arac/${kaydedilenSlug}` : `/arac/${kaydedilenSlug}`
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=0f172a&margin=12&qzone=1`
    const galeriBaslik = galeriAdi || "AutoFlow"
    const fiyatText = form.fiyat_gizle ? "Fiyat için iletişime geçin" : form.fiyat ? `₺${Number(form.fiyat).toLocaleString("tr-TR")}` : ""

    const handleDownloadKart = async () => {
      const element = document.getElementById("qr-card-download-preview")
      if (!element) return
      try {
        const canvas = await html2canvas(element, {
          useCORS: true,
          scale: 3, // Very crisp high-res output for print
          backgroundColor: "#ffffff",
        })
        const image = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.href = image
        link.download = `QR_Kart_${form.marka}_${form.model}.png`
        link.click()
      } catch (err) {
        console.error("Görsel indirilirken hata oluştu:", err)
      }
    }

    return (
      <div className="flex flex-col min-h-screen bg-af-bg text-af-text">
        <PanelTopbar baslik="Araç Eklendi!" />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm mx-auto space-y-6">

            {/* Success badge */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-af-success/10 border border-af-success/20 flex items-center justify-center mx-auto mb-2">
                <Check className="w-6 h-6 text-af-success" />
              </div>
              <h2 className="text-lg font-black text-af-text">{form.marka} {form.model} Eklendi!</h2>
              <p className="text-af-text-secondary text-xs mt-0.5">QR tanıtım kartınız hazır — indirip araca yapıştırabilirsiniz</p>
            </div>

            {/* QR Kart — Ekran Önizlemesi */}
            <div 
              id="qr-card-download-preview" 
              className="bg-gradient-to-b from-[#111111] via-[#161616] to-[#0D0D0D] rounded-3xl p-6 shadow-2xl border border-[#FF7A00]/40 text-center relative overflow-hidden" 
              style={{ fontFamily: "system-ui, sans-serif" }}
            >
              {/* Background decorative glowing lights */}
              <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-[#FF7A00]/5 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-[#FF7A00]/5 blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="space-y-1 mb-5">
                <div className="inline-flex items-center gap-1.5 bg-[#FF7A00]/10 border border-[#FF7A00]/30 rounded-full px-2.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] animate-pulse" />
                  <span className="text-[9px] font-bold tracking-[2.5px] uppercase text-[#FF7A00]">AutoFlow</span>
                </div>
                <h3 className="text-lg font-black text-white tracking-tight">{galeriBaslik}</h3>
                <p className="text-[10px] text-[#FF7A00]/80 font-bold uppercase tracking-[1.5px] mt-0.5">
                  YOLUN YILDIZI SİZ OLUN
                </p>
                <div className="w-8 h-0.5 bg-[#FF7A00]/60 mx-auto mt-2" />
              </div>

              {/* QR Code Container */}
              <div className="my-5 flex flex-col items-center">
                <div className="bg-white border-2 border-[#FF7A00]/30 rounded-2xl p-3.5 shadow-[0_8px_30px_rgba(255,122,0,0.1)] inline-block">
                  <img src={qrImgUrl} alt="QR Kod" width={160} height={160} className="rounded-lg block" />
                </div>
                <span className="text-[9px] font-black tracking-[2px] uppercase text-[#FF7A00] bg-[#FF7A00]/10 border border-[#FF7A00]/25 px-3 py-1 rounded-full mt-3">
                  📱 TARAT VE İNCELE
                </span>
              </div>

              {/* Vehicle info */}
              <div className="space-y-1.5 my-4">
                <h4 className="text-base font-black text-white leading-tight">{form.marka} {form.model}</h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {form.yil}{form.versiyon ? ` · ${form.versiyon}` : ""}{form.yakit ? ` · ${form.yakit}` : ""}{form.vites ? ` · ${form.vites}` : ""}{form.km ? ` · ${Number(form.km).toLocaleString("tr-TR")} km` : ""}
                </p>
              </div>

              {/* Price section */}
              {fiyatText && (
                <div className="my-4">
                  <div className="inline-block bg-[#FF7A00]/15 border border-[#FF7A00]/30 text-[#FF7A00] text-sm font-black px-4 py-1.5 rounded-xl shadow-inner">
                    {fiyatText}
                    {form.pazarlik_var && (
                      <span className="text-[9px] text-white/50 font-semibold ml-1.5 border-l border-white/20 pl-1.5">
                        Pazarlığa Açık
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Footer marketing text */}
              <div className="border-t border-[#2A2A2A] pt-4 mt-4 text-center">
                <p className="text-[9px] text-slate-400 leading-relaxed font-medium">
                  Aracın güncel fiyatı, detaylı ekspertiz raporu ve<br/>
                  tramer geçmişini incelemek için kodu okutun.
                </p>
                <p className="text-[8px] text-[#FF7A00]/50 font-bold uppercase tracking-wider mt-2.5">
                  autoflow.com.tr
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={handleDownloadKart}
                className="w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#FF8C1A] text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-[#FF7A00]/20"
              >
                <Download className="w-4 h-4" />
                Tanıtım Kartını İndir (PNG)
              </button>
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href="/panel/araclar"
                  className="flex items-center justify-center gap-1.5 bg-af-surface-2 hover:bg-af-surface border border-af-border text-af-text-secondary font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Araç Listesi
                </a>
                <button
                  onClick={() => { setTamam(false); setForm(initialForm); setAktifAdim(1); setKaydedilenSlug("") }}
                  className="flex items-center justify-center gap-1.5 bg-af-surface-2 hover:bg-af-surface border border-af-border text-af-text-secondary font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  Yeni Araç Ekle
                </button>
              </div>
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
                <span className={cn(
                  "text-xs transition-all whitespace-nowrap",
                  aktifAdim === adim.id ? "inline font-bold" : "hidden md:inline"
                )}>
                  {adim.baslik}
                </span>
              </button>
              {idx < ADIMLAR.length - 1 && (
                <div className={cn("w-4 sm:w-6 h-px mx-1 flex-shrink-0", aktifAdim > adim.id ? "bg-af-success/30" : "bg-af-border")} />
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
              <FormField label={`Boyalı Parçalar${form.boyali_parcalar.length > 0 ? ` (${form.boyali_parcalar.length} parça)` : ""}`}>
                <div className="bg-af-surface-2/40 rounded-xl border border-af-border p-4">
                  <ArabaKrokisi
                    boyaliParcalar={form.boyali_parcalar}
                    onChange={(parcalar) => update("boyali_parcalar", parcalar)}
                  />
                </div>
              </FormField>
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

          {/* ADIM 4: Hasar Geçmişi */}
          {aktifAdim === 4 && (
            <div className="space-y-6">
              {/* Tramer Kaydı */}
              <FormField label="Tramer Kaydı">
                <div className="flex gap-3 mb-4">
                  {[{ label: "Yok ✅", value: false }, { label: "Var ⚠️", value: true }].map((opt) => (
                    <button key={String(opt.value)} type="button"
                      onClick={() => update("tramer_kaydi", opt.value)}
                      className={cn("flex-1 py-2.5 rounded-xl text-sm border transition-all font-semibold",
                        form.tramer_kaydi === opt.value
                          ? "bg-af-accent border-af-accent text-white"
                          : "bg-af-surface-2 border-af-border text-af-text-secondary hover:border-af-border-light"
                      )}
                    >{opt.label}</button>
                  ))}
                </div>

                {form.tramer_kaydi && (
                  <div className="space-y-4">
                    {/* Mevcut tramer kayıtları */}
                    {form.tramer_detay.length > 0 && (
                      <div className="rounded-xl border border-af-border divide-y divide-af-border overflow-hidden">
                        <div className="grid grid-cols-3 bg-af-surface-2 px-4 py-2">
                          <span className="text-xs font-semibold text-af-text-disabled uppercase tracking-wider">Yıl</span>
                          <span className="text-xs font-semibold text-af-text-disabled uppercase tracking-wider">Tutar</span>
                          <span />
                        </div>
                        {form.tramer_detay.map((t, i) => (
                          <div key={i} className="grid grid-cols-3 items-center px-4 py-3 bg-af-surface">
                            <span className="text-sm font-semibold text-af-text">{t.yil}</span>
                            <span className="text-sm text-af-text-secondary">
                              {t.tutar ? `₺${Number(t.tutar).toLocaleString("tr-TR")}` : "—"}
                            </span>
                            <button
                              type="button"
                              onClick={() => update("tramer_detay", form.tramer_detay.filter((_, idx) => idx !== i))}
                              className="ml-auto w-7 h-7 rounded-lg bg-af-error/10 hover:bg-af-error/20 text-af-error flex items-center justify-center transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Yeni tramer kaydı ekle */}
                    <div className="p-4 bg-af-surface-2/50 rounded-xl border border-af-border border-dashed">
                      <p className="text-xs font-semibold text-af-text-disabled uppercase tracking-wider mb-3">Tramer Kaydı Ekle</p>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="space-y-1">
                          <label className="text-xs text-af-text-secondary">Yıl</label>
                          <input
                            className={inputClass}
                            type="number"
                            placeholder="ör. 2022"
                            min="1990"
                            max={new Date().getFullYear()}
                            value={yeniTramer.yil}
                            onChange={(e) => setYeniTramer((p) => ({ ...p, yil: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-af-text-secondary">Tutar (₺)</label>
                          <input
                            className={inputClass}
                            type="number"
                            placeholder="ör. 45000"
                            value={yeniTramer.tutar}
                            onChange={(e) => setYeniTramer((p) => ({ ...p, tutar: e.target.value }))}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!yeniTramer.yil) return
                          update("tramer_detay", [...form.tramer_detay, yeniTramer])
                          setYeniTramer({ yil: "", tutar: "" })
                        }}
                        disabled={!yeniTramer.yil}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-af-accent hover:bg-af-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Kaydı Ekle
                      </button>
                    </div>
                  </div>
                )}
              </FormField>

              {/* Ağır Hasar Kaydı */}
              <FormField label="Ağır Hasar Kaydı">
                <div className="flex gap-3">
                  {[{ label: "Yok ✅", value: false }, { label: "Var ⚠️", value: true }].map((opt) => (
                    <button key={String(opt.value)} type="button"
                      onClick={() => update("agir_hasar_kaydi", opt.value)}
                      className={cn("flex-1 py-2.5 rounded-xl text-sm border transition-all font-semibold",
                        form.agir_hasar_kaydi === opt.value
                          ? "bg-af-accent border-af-accent text-white"
                          : "bg-af-surface-2 border-af-border text-af-text-secondary hover:border-af-border-light"
                      )}
                    >{opt.label}</button>
                  ))}
                </div>
                {form.agir_hasar_kaydi && (
                  <div className="mt-3 flex items-start gap-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                    <span className="text-amber-400 text-base leading-none mt-0.5">⚠️</span>
                    <p className="text-amber-300/80 text-xs">Bu araçta ağır hasar kaydı bulunmaktadır. Detaylar araç sayfasında görünür.</p>
                  </div>
                )}
              </FormField>
            </div>
          )}

          {/* ADIM 5: Fiyat */}
          {aktifAdim === 5 && (
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

              <FormField label="Araç Açıklaması">
                <textarea
                  className={cn(inputClass, "h-28 py-3 resize-none")}
                  placeholder="Araç hakkında detaylı açıklama yazın... (Örn: Kazasız, boyasız, bakımları yeni yapılmıştır.)"
                  value={form.aciklama}
                  onChange={(e) => update("aciklama", e.target.value)}
                />
              </FormField>
            </div>
          )}

          {/* ADIM 6: Özet */}
          {aktifAdim === 6 && (
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
                  { label: "Boyalı Parça", value: form.boyali_parcalar.length > 0 ? `${form.boyali_parcalar.length} parça` : "Yok" },
                  { label: "Tramer", value: form.tramer_kaydi ? `${form.tramer_detay.length} kayıt` : "Yok" },
                  { label: "Ağır Hasar", value: form.agir_hasar_kaydi ? "Var" : "Yok" },
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
              {form.aciklama && (
                <div className="bg-af-surface-2 rounded-xl p-3">
                  <p className="text-af-text-secondary text-xs mb-1">Açıklama</p>
                  <p className="text-af-text text-sm font-semibold truncate">{form.aciklama}</p>
                </div>
              )}

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
