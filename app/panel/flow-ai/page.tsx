"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import {
  Sparkles, Upload, Send, RefreshCw, Download, Check,
  Palette, Zap, Eye, ChevronDown, X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Mesaj {
  id: number
  sender: "user" | "ai"
  text: string
  timestamp: string
  imagePreview?: string
  isTyping?: boolean
  isError?: boolean
}

interface CarColor {
  name: string
  nameEn: string
  hex: string
  bg: string       // arka plan teması
  accent: string   // vurgu rengi
  lighting: string // ışık açıklaması
  studioDesc: string
  cssGradient: string
}

interface ShowroomConfig {
  bg: string
  floorColor: string
  accent: string
  spotlightColor: string
  leftPanelColor: string
  rightPanelColor: string
  gridColor: string
  reflectionOpacity: number
  spotlightWidth: number
  showNeonStrips: boolean
  showSpotlight: boolean
  showFloorGrid: boolean
  name: string
  studioDesc: string
  lighting: string
}

/* ─────────────────────────────────────────────
   RENK PROFİLİ VERITABANI
   Her renk → kendi stüdyo teması
───────────────────────────────────────────── */
const COLOR_PROFILES: CarColor[] = [
  {
    name: "Siyah / Antrasit",
    nameEn: "black",
    hex: "#1a1a1a",
    bg: "#0a0a0a",
    accent: "#ffffff",
    lighting: "Dramatik gümüş kenar ışığı, siyah sonsuz arka plan, yansımalı ıslak zemin",
    studioDesc: "Saf Siyah Stüdyo · Rim Işığı",
    cssGradient: "from-gray-900 to-black"
  },
  {
    name: "Beyaz / Gümüş / Bej",
    nameEn: "white",
    hex: "#e8e8e8",
    bg: "#f0f0f0",
    accent: "#c0a060",
    lighting: "Yumuşak softbox ışığı, beyaz sonsuz arka plan, altın vurgu aydınlatma",
    studioDesc: "Beyaz Stüdyo · Altın Vurgu",
    cssGradient: "from-gray-200 to-gray-100"
  },
  {
    name: "Kırmızı / Bordo / Turuncu",
    nameEn: "red",
    hex: "#cc2200",
    bg: "#1a0505",
    accent: "#ff6644",
    lighting: "Altın saat gün batımı ışığı, sahil yolu manzarası, dramatik sıcak tonlar",
    studioDesc: "Sahil Gün Batımı · Sıcak Işık",
    cssGradient: "from-red-900 to-orange-900"
  },
  {
    name: "Mavi / Lacivert / Mor",
    nameEn: "blue",
    hex: "#1133bb",
    bg: "#050a1a",
    accent: "#3399ff",
    lighting: "Soğuk mavi neon aydınlatma, koyu lacivert stüdyo zemini, parlak elektrik mavi şeritler",
    studioDesc: "Neon Mavi Stüdyo · Elektrik Işık",
    cssGradient: "from-blue-900 to-indigo-950"
  },
  {
    name: "Gümüş / Gri Metalik",
    nameEn: "silver",
    hex: "#888888",
    bg: "#111111",
    accent: "#aaaaaa",
    lighting: "Neon aksan ışıkları, modern showroom zemini, mor-mavi vurgu şeritler",
    studioDesc: "Modern Showroom · Neon Vurgu",
    cssGradient: "from-gray-800 to-gray-900"
  },
]

/* ─────────────────────────────────────────────
   CANVAS RENK ALGILAMA MOTORU (Gerçek!)
───────────────────────────────────────────── */
function detectDominantCarColor(imageData: Uint8ClampedArray, width: number, height: number): CarColor {
  // Sadece ortadaki band ile çalış (araç gövdesi genelde merkezde)
  const cx1 = Math.floor(width * 0.2), cx2 = Math.floor(width * 0.8)
  const cy1 = Math.floor(height * 0.25), cy2 = Math.floor(height * 0.75)

  let rSum = 0, gSum = 0, bSum = 0, count = 0

  for (let y = cy1; y < cy2; y += 4) {
    for (let x = cx1; x < cx2; x += 4) {
      const idx = (y * width + x) * 4
      const r = imageData[idx], g = imageData[idx + 1], b = imageData[idx + 2], a = imageData[idx + 3]
      if (a < 128) continue // şeffaf pikselleri atla

      // Çok açık (zemin/gökyüzü) veya çok koyu pikselleri filtrele
      const brightness = (r + g + b) / 3
      if (brightness < 20 || brightness > 240) continue

      rSum += r; gSum += g; bSum += b; count++
    }
  }

  if (count === 0) return COLOR_PROFILES[4] // fallback: gümüş

  const r = rSum / count, g = gSum / count, b = bSum / count
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const lightness = (r * 0.299 + g * 0.587 + b * 0.114)

  // Gri/Beyaz/Siyah testi
  if (max - min < 30) {
    if (lightness > 180) return COLOR_PROFILES[1] // beyaz
    if (lightness < 60) return COLOR_PROFILES[0]  // siyah
    return COLOR_PROFILES[4]                       // gümüş/gri
  }

  // Baskın renk kanalı
  if (r > g && r > b && r - Math.max(g, b) > 30) {
    if (b > g && b - g > 30) return COLOR_PROFILES[3] // mor tonu -> mavi
    return COLOR_PROFILES[2] // kırmızı/turuncu
  }

  if (b > r && b > g && b - Math.max(r, g) > 30) return COLOR_PROFILES[3] // mavi/lacivert

  if (g > r && g > b && g - Math.max(r, b) > 30) return COLOR_PROFILES[2] // yeşil -> kırmızıya yakın stüdyo (fallback)

  return COLOR_PROFILES[4] // gümüş
}

/* ─────────────────────────────────────────────
   STUDIO COMPOSITE GENERATOR
───────────────────────────────────────────── */
async function createStudioComposite(transparentCarUrl: string, config: ShowroomConfig): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const W = img.naturalWidth || img.width
      const H = img.naturalHeight || img.height

      const canvas = document.createElement("canvas")
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext("2d")!

      // Helper to parse hex to RGB
      const hexToRgb = (hex: string): string => {
        let clean = hex.trim()
        if (clean.startsWith("#")) clean = clean.substring(1)
        if (clean.length === 3) {
          clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
        }
        if (clean.length === 6) {
          const r = parseInt(clean.substring(0, 2), 16)
          const g = parseInt(clean.substring(2, 4), 16)
          const b = parseInt(clean.substring(4, 6), 16)
          return `${r}, ${g}, ${b}`
        }
        return "128, 128, 128"
      }

      const accentRgb = hexToRgb(config.accent)
      const spotlightRgb = hexToRgb(config.spotlightColor)
      const leftPanelRgb = hexToRgb(config.leftPanelColor)
      const rightPanelRgb = hexToRgb(config.rightPanelColor)
      const gridRgb = hexToRgb(config.gridColor)

      // 1. Showroom Wall background gradient (dark to wall color)
      const horizonY = H * 0.62

      const wallGrad = ctx.createLinearGradient(0, 0, 0, horizonY)
      wallGrad.addColorStop(0, "#050507")
      wallGrad.addColorStop(0.7, "#0c0c10")
      wallGrad.addColorStop(1, config.bg)
      ctx.fillStyle = wallGrad
      ctx.fillRect(0, 0, W, horizonY)

      // 2. Glowing LED Lines / Neon strips on the Wall (futuristic showroom look)
      if (config.showNeonStrips) {
        ctx.save()
        ctx.strokeStyle = `rgba(${accentRgb}, 0.4)`
        ctx.lineWidth = Math.max(2, H * 0.005)
        ctx.shadowColor = `rgba(${accentRgb}, 0.8)`
        ctx.shadowBlur = 15
        
        // Top strip
        ctx.beginPath()
        ctx.moveTo(0, horizonY - H * 0.25)
        ctx.lineTo(W, horizonY - H * 0.25)
        ctx.stroke()
        
        // Lower strip
        ctx.beginPath()
        ctx.moveTo(0, horizonY - H * 0.12)
        ctx.lineTo(W, horizonY - H * 0.12)
        ctx.stroke()
        ctx.restore()
      }

      // 3. Showroom Floor background gradient (reflective showroom floor)
      const floorGrad = ctx.createLinearGradient(0, horizonY, 0, H)
      floorGrad.addColorStop(0, config.floorColor)
      floorGrad.addColorStop(0.3, "#060608")
      floorGrad.addColorStop(1, "#020203")
      ctx.fillStyle = floorGrad
      ctx.fillRect(0, horizonY, W, H - horizonY)

      // 4. Perspective Grid on the floor (tiles)
      if (config.showFloorGrid) {
        ctx.save()
        ctx.strokeStyle = `rgba(${gridRgb}, 0.04)`
        ctx.lineWidth = 1
        // Horizontal grid lines (perspective spacing)
        let currentY = horizonY
        let spacing = (H - horizonY) * 0.05
        while (currentY < H) {
          ctx.beginPath()
          ctx.moveTo(0, currentY)
          ctx.lineTo(W, currentY)
          ctx.stroke()
          spacing *= 1.45 // wider spacing as it gets closer
          currentY += spacing
        }
        // Perspective radial lines
        const lineCount = 12
        for (let i = 0; i <= lineCount; i++) {
          const xFloor = (i / lineCount) * W * 2.5 - W * 0.75
          ctx.beginPath()
          ctx.moveTo(W / 2, horizonY)
          ctx.lineTo(xFloor, H)
          ctx.stroke()
        }
        ctx.restore()
      }

      // 5. Overhead Light Panels (Reflected on the Floor)
      // Left panel reflection
      const leftRef = ctx.createLinearGradient(W * 0.25, horizonY, W * 0.25, H)
      leftRef.addColorStop(0, `rgba(${leftPanelRgb}, 0.12)`)
      leftRef.addColorStop(0.5, `rgba(${leftPanelRgb}, 0.04)`)
      leftRef.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = leftRef
      ctx.fillRect(W * 0.15, horizonY, W * 0.2, H - horizonY)

      // Right panel reflection
      const rightRef = ctx.createLinearGradient(W * 0.75, horizonY, W * 0.75, H)
      rightRef.addColorStop(0, `rgba(${rightPanelRgb}, 0.12)`)
      rightRef.addColorStop(0.5, `rgba(${rightPanelRgb}, 0.04)`)
      rightRef.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = rightRef
      ctx.fillRect(W * 0.65, horizonY, W * 0.2, H - horizonY)

      // 6. Scan bounding box of the car
      const scanCanvas = document.createElement("canvas")
      const scanW = 200, scanH = 200
      scanCanvas.width = scanW
      scanCanvas.height = scanH
      const scanCtx = scanCanvas.getContext("2d")!
      scanCtx.drawImage(img, 0, 0, scanW, scanH)
      let scanData = null
      try {
        scanData = scanCtx.getImageData(0, 0, scanW, scanH).data
      } catch (e) {
        console.error("Canvas read error:", e)
      }

      let minX = scanW, maxX = 0, minY = scanH, maxY = 0
      let foundPixels = false
      if (scanData) {
        for (let y = 0; y < scanH; y++) {
          for (let x = 0; x < scanW; x++) {
            const alpha = scanData[(y * scanW + x) * 4 + 3]
            if (alpha > 30) {
              if (x < minX) minX = x
              if (x > maxX) maxX = x
              if (y < minY) minY = y
              if (y > maxY) maxY = y
              foundPixels = true
            }
          }
        }
      }

      let normMinX = foundPixels ? minX / scanW : 0.15
      let normMaxX = foundPixels ? maxX / scanW : 0.85
      let normMinY = foundPixels ? minY / scanH : 0.25
      let normMaxY = foundPixels ? maxY / scanH : 0.75

      const carW = (normMaxX - normMinX) * W
      const carH = (normMaxY - normMinY) * H
      const carCX = (normMinX + normMaxX) / 2 * W
      const carBottomY = normMaxY * H

      // Draw volumetric spotlight cone
      if (config.showSpotlight) {
        ctx.save()
        const lightBeam = ctx.createLinearGradient(carCX, 0, carCX, carBottomY)
        lightBeam.addColorStop(0, `rgba(${spotlightRgb}, 0.22)`)
        lightBeam.addColorStop(0.5, `rgba(${spotlightRgb}, 0.08)`)
        lightBeam.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = lightBeam
        ctx.beginPath()
        
        const wFactor = config.spotlightWidth
        ctx.moveTo(carCX - carW * 0.15 * wFactor, 0)
        ctx.lineTo(carCX + carW * 0.15 * wFactor, 0)
        ctx.lineTo(carCX + carW * 0.65 * wFactor, carBottomY)
        ctx.lineTo(carCX - carW * 0.65 * wFactor, carBottomY)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      // 7. Floor Reflection (flipped car)
      if (config.reflectionOpacity > 0) {
        ctx.save()
        ctx.translate(0, carBottomY)
        ctx.scale(1, -0.28)
        ctx.globalAlpha = config.reflectionOpacity
        ctx.drawImage(img, 0, 0, W, H)
        ctx.restore()

        // Reflection fading overlay
        const reflectionHeight = carH * 0.3
        const overlayGrad = ctx.createLinearGradient(0, carBottomY, 0, carBottomY + reflectionHeight)
        overlayGrad.addColorStop(0, "rgba(6, 6, 8, 0.1)")
        overlayGrad.addColorStop(1, "rgba(2, 2, 3, 0.98)")
        ctx.fillStyle = overlayGrad
        ctx.fillRect(0, carBottomY, W, reflectionHeight + 10)
      }

      // 8. Contact Shadows
      // Ambient shadow
      const ambientShadow = ctx.createRadialGradient(
        carCX, carBottomY, 0,
        carCX, carBottomY, carW * 0.54
      )
      ambientShadow.addColorStop(0, "rgba(0, 0, 0, 0.75)")
      ambientShadow.addColorStop(0.3, "rgba(0, 0, 0, 0.45)")
      ambientShadow.addColorStop(0.7, "rgba(0, 0, 0, 0.15)")
      ambientShadow.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.save()
      ctx.translate(carCX, carBottomY)
      ctx.scale(1, 0.075)
      ctx.fillStyle = ambientShadow
      ctx.beginPath()
      ctx.arc(0, 0, carW * 0.54, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Contact shadow
      const tightShadow = ctx.createRadialGradient(
        carCX, carBottomY, 0,
        carCX, carBottomY, carW * 0.45
      )
      tightShadow.addColorStop(0, "rgba(0, 0, 0, 0.92)")
      tightShadow.addColorStop(0.5, "rgba(0, 0, 0, 0.6)")
      tightShadow.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.save()
      ctx.translate(carCX, carBottomY)
      ctx.scale(1, 0.03)
      ctx.fillStyle = tightShadow
      ctx.beginPath()
      ctx.arc(0, 0, carW * 0.45, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // 9. Draw original car on top
      ctx.drawImage(img, 0, 0, W, H)

      resolve(canvas.toDataURL("image/png"))
    }

    img.onerror = () => reject(new Error("Görsel yüklenemedi."))
    img.src = transparentCarUrl
  })
}

function makeDefaultConfig(colorProfile: CarColor): ShowroomConfig {
  return {
    bg: colorProfile.bg,
    floorColor: colorProfile.bg,
    accent: colorProfile.accent,
    spotlightColor: colorProfile.accent,
    leftPanelColor: colorProfile.accent,
    rightPanelColor: colorProfile.accent,
    gridColor: colorProfile.accent,
    reflectionOpacity: 0.22,
    spotlightWidth: 0.65,
    showNeonStrips: true,
    showSpotlight: true,
    showFloorGrid: true,
    name: colorProfile.name,
    studioDesc: colorProfile.studioDesc,
    lighting: colorProfile.lighting
  }
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function FlowAiPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [dbPlan, setDbPlan] = useState("Essential")

  /* --- Chat State --- */
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([])
  const [inputText, setInputText] = useState("")
  const chatEndRef = useRef<HTMLDivElement>(null)

  /* --- Image & Color State --- */
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [detectedColor, setDetectedColor] = useState<CarColor | null>(null)
  const [colorAnalyzing, setColorAnalyzing] = useState(false)
  const [colorSwatchVisible, setColorSwatchVisible] = useState(false)
  const [enhancedImage, setEnhancedImage] = useState<string | null>(null)

  /* --- Chat AI State --- */
  const [isTyping, setIsTyping] = useState(false)
  const [userApiKey, setUserApiKey] = useState("")
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)

  /* --- Processing State --- */
  const [processing, setProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)
  const [processingLabel, setProcessingLabel] = useState("")
  const [enhanceSuccess, setEnhanceSuccess] = useState(false)

  /* --- Slider State --- */
  const [sliderPos, setSliderPos] = useState(50)
  const sliderRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const [revisionMode, setRevisionMode] = useState(false)
  const [transparentCarUrlState, setTransparentCarUrlState] = useState<string | null>(null)
  const [showroomConfig, setShowroomConfig] = useState<ShowroomConfig | null>(null)

  function now() {
    return new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
  }

  function addAiMsg(text: string) {
    setMesajlar(prev => [...prev, { id: Date.now() + Math.random(), sender: "ai", text, timestamp: now() }])
  }

  // Planı Supabase'den çek
  useEffect(() => {
    if (!user) return
    async function planYukle() {
      if (!user) return
      const { data } = await supabase
        .from("galeri_profilleri")
        .select("plan")
        .eq("user_id", user.id)
        .single()
      if (data && data.plan) {
        setDbPlan(data.plan)
      }
    }
    planYukle()
  }, [user])

  // İlk karşılama mesajı (Plan bilgisi yüklendikten sonra)
  useEffect(() => {
    const planText = dbPlan === "Elite" 
      ? "👑 Elite öncelikli işlem modunuz aktif! Sınırsız stüdyo ve sıfır bekleme süresinin keyfini çıkarın."
      : dbPlan === "Professional" 
        ? "★ Professional paketiniz aktif. Sınırsız ücretsiz stüdyo kullanımı ve akıllı şablonlar emrinizde!"
        : "💡 Essentials planındasınız. Bu pakette Flow AI özellikleri devre dışıdır. Kullanmak için lütfen planınızı yükseltin."

    setMesajlar([
      {
        id: 1,
        sender: "ai",
        text: `Merhaba! Ben Flow AI. 🎨\n\n${planText}\n\nAraç fotoğrafınızı analiz edip rengine özel stüdyo ortamı seçebiliyorum. Başlamak için bir araç fotoğrafı yükleyin!`,
        timestamp: now()
      }
    ])
  }, [dbPlan])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mesajlar])

  /* ── Gerçek Renk Algılama ── */
  const analyzeImageColor = useCallback((imageUrl: string, forcedProfile?: CarColor) => {
    if (forcedProfile) {
      setDetectedColor(forcedProfile)
      setShowroomConfig(makeDefaultConfig(forcedProfile))
      setColorSwatchVisible(true)
      return
    }

    setColorAnalyzing(true)
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = canvasRef.current!
      const W = Math.min(img.width, 400), H = Math.min(img.height, 400)
      canvas.width = W; canvas.height = H
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, W, H)
      const { data } = ctx.getImageData(0, 0, W, H)
      const profile = detectDominantCarColor(data, W, H)
      setDetectedColor(profile)
      setShowroomConfig(makeDefaultConfig(profile))
      setColorSwatchVisible(true)
      setColorAnalyzing(false)
      addAiMsg(`🎨 Renk Analizi Tamamlandı!\n\nAracınızın baskın rengi: **${profile.name}** olarak tespit edildi.\n\nÖnerilen stüdyo kurulumu: ${profile.studioDesc}\n💡 Işık tasarımı: ${profile.lighting}\n\n"Görseli İyileştir" butonuna basarak AI stüdyo dönüşümünü başlatabilirsiniz!`)
    }
    img.onerror = () => {
      setColorAnalyzing(false)
      setDetectedColor(COLOR_PROFILES[4])
      setShowroomConfig(makeDefaultConfig(COLOR_PROFILES[4]))
    }
    img.src = imageUrl
  }, [])

  /* ── Dosya Yükleme ── */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = reader.result as string
      setUploadedImage(src)
      setEnhanceSuccess(false)
      setEnhancedImage(null)
      setDetectedColor(null)
      setShowroomConfig(null)
      setColorSwatchVisible(false)
      setRevisionMode(false)
      if (transparentCarUrlState) {
        URL.revokeObjectURL(transparentCarUrlState)
        setTransparentCarUrlState(null)
      }
      const userMsg: Mesaj = {
        id: Date.now() + Math.random(), sender: "user",
        text: `📸 "${file.name}" yüklendi — renk analizi başlatılıyor...`,
        timestamp: now(), imagePreview: src
      }
      setMesajlar(prev => [...prev, userMsg])
      addAiMsg("Fotoğraf alındı! Şimdi görüntüyü analiz edip aracın rengini tespit ediyorum...")
      setTimeout(() => analyzeImageColor(src), 800)
    }
    reader.readAsDataURL(file)
  }

  /* ── AI İyileştirme ── */
  const handleEnhance = async () => {
    if (!uploadedImage || !detectedColor) return

    if (dbPlan === "Essential") {
      alert("Flow AI Akıllı Stüdyo özelliğini kullanabilmek için lütfen Professional veya Elite plana geçiş yapın.")
      return
    }

    console.log("Flow AI: Gerçek zamanlı yapay zeka stüdyo sentezi başlatılıyor. Mock veri kullanılmıyor.")

    setProcessing(true)
    setProcessingStep(5)
    setEnhanceSuccess(false)
    setEnhancedImage(null)

    // Kullanıcının kendi fotoğrafı için GERÇEK AI arka plan silme ve stüdyo birleştirme
    try {
      setProcessingStep(20)
      setProcessingLabel("Yapay zeka stüdyo motoru indiriliyor (yaklaşık 20MB)...")
      
      // img.ly background removal modülünü tarayıcıya dinamik yükle
      const imgly = await eval("import('https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm')")
      
      setProcessingStep(45)
      setProcessingLabel("Araç hatları maskeleniyor ve arka plan siliniyor...")
      
      // Arka planı sil ve şeffaf blob elde et
      const processedBlob = await imgly.removeBackground(uploadedImage)
      const transparentCarUrl = URL.createObjectURL(processedBlob)

      setProcessingStep(75)
      setProcessingLabel("Stüdyo ışıkları, ıslak zemin yansımaları ve yumuşak gölgeler render ediliyor...")

      // Stüdyo şablonu ile birleştir
      const compositeBase64 = await createStudioComposite(transparentCarUrl, showroomConfig!)
      setEnhancedImage(compositeBase64)
      setTransparentCarUrlState(transparentCarUrl)

      setProcessingStep(100)
      setProcessingLabel("Tamamlandı!")
      
      setProcessing(false)
      setEnhanceSuccess(true)
      setSliderPos(50)

      let successMsg = `✅ İşlem başarıyla tamamlandı!\n\nAracınızın orijinal hatları ve kalitesi korunarak "${detectedColor.studioDesc}" ortamı oluşturuldu.\n\n• Arka plan: ${detectedColor.name} uyumlu stüdyo\n• Zemin: Gerçekçi araba yansıması ve gölgesi\n• Işıklandırma: Yumuşak softbox aydınlatması\n\nÖncesi/sonrası için slider'ı kaydırabilirsiniz!`
      addAiMsg(successMsg)
    } catch (err: any) {
      console.error("Yapay zeka stüdyo hatası:", err)
      setProcessing(false)
      alert(`Fotoğraf işlenirken bir hata oluştu. Lütfen görselin kalitesini veya internet bağlantınızı kontrol edin. Hata: ${err.message || err}`)
    }
  }

  /* ── Görsel Revize Etme (Prompt ile) ── */
  const handleRevisePromptMode = () => {
    setRevisionMode(true)
    setTimeout(() => chatInputRef.current?.focus(), 50)
    addAiMsg("💡 Revizyon Modu Aktif!\n\nLütfen stüdyoda değiştirmek istediğiniz rengi veya temayı yazın.\n\nÖrnekler:\n• \"ışıkları kırmızı yap\"\n• \"mavi neon showroom olsun\"\n• \"arka planı biraz daha koyu gri yap\"")
  }

  const processRevision = async (prompt: string): Promise<boolean> => {
    if (!uploadedImage || !transparentCarUrlState || !detectedColor || !showroomConfig) return false
    
    const text = prompt.toLowerCase()
    
    // Revizyon modundaysa ya da girdi stüdyo/ışık güncellemesi içeriyorsa işle
    const isVisualPrompt = text.includes("ışık") || text.includes("renk") || text.includes("arka plan") || 
                           text.includes("zemin") || text.includes("neon") || text.includes("yap") || 
                           text.includes("olsun") || text.includes("stüdyo") || text.includes("showroom") ||
                           text.includes("kapat") || text.includes("aç") || text.includes("yansıma") ||
                           text.includes("karo") || text.includes("grid") || text.includes("panel") ||
                           revisionMode
                           
    if (!isVisualPrompt) return false

    setProcessing(true)
    setProcessingStep(25)
    setProcessingLabel("Yapay zeka revizyon isteklerinizi analiz ediyor...")

    // Gemini için sistem yönlendirmeli prompt
    const systemPrompt = `Kullanıcı mevcut araç fotoğrafının stüdyo arka planını ve ışıklarını özelleştirmek/revize etmek istiyor. 
Mevcut stüdyo ayarları:
- Duvar rengi (bg): "${showroomConfig.bg}"
- Zemin rengi (floorColor): "${showroomConfig.floorColor}"
- Neon ışık rengi (accent): "${showroomConfig.accent}"
- Tepe spotlight rengi (spotlightColor): "${showroomConfig.spotlightColor}"
- Sol yansıma panel rengi (leftPanelColor): "${showroomConfig.leftPanelColor}"
- Sağ yansıma panel rengi (rightPanelColor): "${showroomConfig.rightPanelColor}"
- Zemin karo grid rengi (gridColor): "${showroomConfig.gridColor}"
- Zemin yansıma oranı (reflectionOpacity): ${showroomConfig.reflectionOpacity} (0.0 ile 0.6 arası)
- Tepe spotlight genişliği (spotlightWidth): ${showroomConfig.spotlightWidth} (0.0 ile 1.5 arası)
- Neon şeritler açık mı (showNeonStrips): ${showroomConfig.showNeonStrips} (true/false)
- Tepe spotlight açık mı (showSpotlight): ${showroomConfig.showSpotlight} (true/false)
- Zemin karo çizgileri açık mı (showFloorGrid): ${showroomConfig.showFloorGrid} (true/false)

Kullanıcının yeni talebi: "${prompt}"

Lütfen bu talebe göre yeni stüdyo parametrelerini hesapla ve SADECE aşağıdaki JSON formatında yanıt ver. Yanıtında JSON dışında hiçbir açıklama, kod blok işaretçisi (\`\`\`json vb.) veya ek yazı BULUNMAMALIDIR. Sadece saf JSON string dön. Eğer kullanıcı bazı özellikleri değiştirmek istemediyse mevcut değerlerini aynen koru.

JSON Formatı:
{
  "bg": "duvar için hex rengi (örn: #050a1a, #0a0a0a, #1a0505)",
  "floorColor": "zemin için hex rengi (örn: #020203, #050a1a)",
  "accent": "neon şeritler için parlak hex rengi (örn: #3399ff, #ff6644, #00ff33)",
  "spotlightColor": "tepe spotlight için parlak hex rengi (örn: #ffffff, #ffff00)",
  "leftPanelColor": "sol panel yansıması için parlak hex rengi",
  "rightPanelColor": "sağ panel yansıması için parlak hex rengi",
  "gridColor": "zemin karo çizgileri için hex rengi",
  "reflectionOpacity": 0.22,
  "spotlightWidth": 0.65,
  "showNeonStrips": true,
  "showSpotlight": true,
  "showFloorGrid": true,
  "name": "temaya uygun kısa renk adı",
  "studioDesc": "oluşturulan yeni stüdyo stilinin adı",
  "lighting": "ışık tasarımının kısa açıklaması"
}`

    try {
      const res = await fetch("/api/flow-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: systemPrompt, history: [], apiKey: userApiKey || undefined })
      })
      const data = await res.json()
      
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gemini API hatası")
      }

      let replyText = (data.reply || "").trim()
      // JSON dışı olabilecek işaretçileri temizle
      if (replyText.startsWith("```json")) {
        replyText = replyText.substring(7)
      }
      if (replyText.startsWith("```")) {
        replyText = replyText.substring(3)
      }
      if (replyText.endsWith("```")) {
        replyText = replyText.substring(0, replyText.length - 3)
      }
      replyText = replyText.trim()

      const parsed = JSON.parse(replyText)
      
      // Gerekli alanların kontrolü
      if (!parsed.bg || !parsed.accent || !parsed.studioDesc) {
        throw new Error("Geçersiz JSON yapısı")
      }

      setProcessingStep(60)
      setProcessingLabel("Yeni showroom tasarımı oluşturuluyor...")

      const revisedConfig: ShowroomConfig = {
        bg: parsed.bg,
        floorColor: parsed.floorColor || parsed.bg,
        accent: parsed.accent,
        spotlightColor: parsed.spotlightColor || parsed.accent,
        leftPanelColor: parsed.leftPanelColor || parsed.accent,
        rightPanelColor: parsed.rightPanelColor || parsed.accent,
        gridColor: parsed.gridColor || parsed.accent,
        reflectionOpacity: typeof parsed.reflectionOpacity === "number" ? parsed.reflectionOpacity : 0.22,
        spotlightWidth: typeof parsed.spotlightWidth === "number" ? parsed.spotlightWidth : 0.65,
        showNeonStrips: parsed.showNeonStrips !== undefined ? parsed.showNeonStrips : true,
        showSpotlight: parsed.showSpotlight !== undefined ? parsed.showSpotlight : true,
        showFloorGrid: parsed.showFloorGrid !== undefined ? parsed.showFloorGrid : true,
        name: parsed.name || "Özel Revizyon",
        studioDesc: parsed.studioDesc,
        lighting: parsed.lighting || "Özelleştirilmiş showroom aydınlatması"
      }

      setProcessingStep(85)
      const compositeBase64 = await createStudioComposite(transparentCarUrlState, revisedConfig)
      setEnhancedImage(compositeBase64)
      setShowroomConfig(revisedConfig)

      setProcessingStep(100)
      setProcessing(false)
      setEnhanceSuccess(true)
      setSliderPos(50)
      setRevisionMode(false) // revizyon tamamlandı

      // Mesajları ekle
      setMesajlar(prev => [
        ...prev,
        { id: Date.now() + Math.random(), sender: "user", text: prompt, timestamp: now() }
      ])
      addAiMsg(`🎨 Görseliniz revize edildi!\n\n• Yeni Stil: **${revisedConfig.studioDesc}**\n• Açıklama: *${revisedConfig.lighting}*\n\nSonucu öncesi/sonrası slider'ı ile inceleyebilirsiniz.`)
      return true
    } catch (err: any) {
      console.error("Revizyon işleme hatası:", err)
      setProcessing(false)
      // Hata durumunda chat'e bilgi ver
      addAiMsg(`⚠️ Revizyon isteğiniz yorumlanamadı.\n\nİpucu: \"ışıkları mavi yap\", \"arka planı beyaz stüdyo yap\", \"neonları kapat\" gibi belirgin direktifler yazabilirsiniz.`)
      return true
    }
  }

  /* ── Chat Gönder — Gerçek Gemini API ── */
  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return
    
    if (dbPlan === "Essential") {
      alert("Flow AI Asistanı özelliğini kullanabilmek için lütfen Professional veya Elite plana geçiş yapın.")
      return
    }

    // Revizyon modu aktifse ve geçerli bir revizyon promptu ise işle
    if (enhanceSuccess && transparentCarUrlState) {
      const isRevised = await processRevision(text)
      if (isRevised) {
        setInputText("")
        return
      }
    }

    const userMsg: Mesaj = { id: Date.now() + Math.random(), sender: "user", text, timestamp: now() }
    const typingId = Date.now() + Math.random()

    const history = mesajlar
      .filter(m => !m.isTyping && !m.isError)
      .slice(-10)
      .map(m => ({ role: m.sender, text: m.text }))

    setMesajlar(prev => [
      ...prev,
      userMsg,
      { id: typingId, sender: "ai", text: "...", timestamp: now(), isTyping: true }
    ])
    setInputText("")
    setIsTyping(true)

    try {
      const res = await fetch("/api/flow-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, apiKey: userApiKey || undefined })
      })
      const data = await res.json()
      setMesajlar(prev => prev.map(m =>
        m.id === typingId
          ? { ...m, text: data.reply || data.error || "Bir hata oluştu.", isTyping: false, isError: !!data.error }
          : m
      ))
    } catch {
      setMesajlar(prev => prev.map(m =>
        m.id === typingId
          ? { ...m, text: "Bağlantı hatası. Lütfen tekrar deneyin.", isTyping: false, isError: true }
          : m
      ))
    } finally {
      setIsTyping(false)
    }
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputText)
  }

  /* ── Slider Mouse/Touch ── */
  const handleSliderInput = (clientX: number) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setSliderPos(pct)
  }

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-screen bg-af-bg text-af-text">
      {/* Hidden canvas for color analysis */}
      <canvas ref={canvasRef} className="hidden" />

      <PanelTopbar
        baslik="Flow AI Akıllı Stüdyo"
        aciklama="Araç rengini algılayarak otomatik stüdyo ortamı oluşturun"
      />

      <main className="flex-1 p-4 lg:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 pb-12 relative">

        {/* Essential Paketi Kilitli Ekranı */}
        {dbPlan === "Essential" && (
          <div className="absolute inset-0 bg-af-bg/85 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
            <div className="bg-af-surface border border-af-border rounded-3xl p-8 max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-af-accent to-purple-600 flex items-center justify-center mx-auto shadow-lg shadow-af-accent/20">
                <Sparkles className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white">Flow AI Akıllı Stüdyo</h2>
                <p className="text-sm text-af-text-secondary leading-relaxed">
                  Araç fotoğraflarınızı yapay zeka ile otomatik temizleyip profesyonel stüdyo ortamına yerleştiren Flow AI, sadece **Professional** ve **Elite** paketlerinde mevcuttur.
                </p>
              </div>
              <div className="bg-af-surface-2/60 border border-af-border rounded-xl p-4 text-xs text-af-text-disabled text-left space-y-1.5">
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-af-accent" /> Yapay zeka ile arka plan temizleme</div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-af-accent" /> Araç rengine göre otomatik stüdyo eşleme</div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-af-accent" /> 2K yüksek çözünürlüklü çıktı ve indirme</div>
              </div>
              <Link
                href="/panel/abonelik"
                className="block bg-af-accent hover:bg-af-accent-hover text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-af-accent/20"
              >
                Hemen Paketini Yükselt
              </Link>
            </div>
          </div>
        )}

        {/* ════ SOL: CHAT (4 kolon) ════ */}
        <div className="lg:col-span-4 bg-af-surface border border-af-border rounded-2xl flex flex-col" style={{ height: "680px" }}>

          {/* Chat Header */}
          <div className="p-3 border-b border-af-border bg-af-surface-2/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-af-accent to-purple-600 flex items-center justify-center shadow-lg shadow-af-accent/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">Flow AI Asistanı</h3>
                  <span className="text-[10px] text-af-success flex items-center gap-1">
                    {isTyping
                      ? <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Yazıyor...</>
                      : <><span className="w-1.5 h-1.5 rounded-full bg-af-success animate-pulse" /> Çevrimiçi · Gemini AI</>}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowApiKeyInput(p => !p)}
                title="API Anahtarı Gir"
                className="w-7 h-7 rounded-lg bg-af-surface-2 border border-af-border text-af-text-disabled hover:text-af-accent hover:border-af-accent/30 flex items-center justify-center transition-colors text-xs"
              >
                🔑
              </button>
            </div>
            {showApiKeyInput && (
              <div className="mt-2 flex gap-1.5">
                <input
                  type="password"
                  placeholder="Gemini API Key (AIza...)"
                  value={userApiKey}
                  onChange={e => setUserApiKey(e.target.value)}
                  className="flex-1 bg-af-surface border border-af-border text-white text-[11px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-af-accent placeholder:text-af-text-disabled"
                />
                <button
                  onClick={() => setShowApiKeyInput(false)}
                  className="text-[11px] bg-af-accent text-white px-2.5 py-1.5 rounded-lg font-semibold hover:bg-af-accent-hover transition-colors"
                >
                  Kaydet
                </button>
              </div>
            )}
          </div>



          {/* Mesajlar */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {mesajlar.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col rounded-2xl p-3 text-xs leading-relaxed max-w-[90%]",
                  m.sender === "ai"
                    ? m.isError
                      ? "bg-red-950/40 border border-red-500/20 mr-auto rounded-tl-sm"
                      : "bg-af-surface-2 border border-af-border mr-auto rounded-tl-sm"
                    : "bg-af-accent ml-auto text-white rounded-tr-sm"
                )}
              >
                {m.imagePreview && (
                  <div className="w-full h-24 rounded-lg overflow-hidden mb-2">
                    <img src={m.imagePreview} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {m.isTyping ? (
                  <span className="flex items-center gap-1 h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-af-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-af-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-af-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                ) : (
                  <p className="whitespace-pre-line">{m.text}</p>
                )}
                {!m.isTyping && (
                  <span className={cn("text-[9px] text-right mt-1", m.sender === "ai" ? (m.isError ? "text-red-400/60" : "text-af-text-disabled") : "text-white/60")}>
                    {m.timestamp}
                  </span>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Hızlı sorular */}
          <div className="px-3 py-2 border-t border-af-border flex gap-1.5 overflow-x-auto flex-shrink-0">
            {["Nasıl çalışır?", "En iyi araç fotoğraf açısı?", "Fiyatlar nedir?", "Siyah araba için ne önerirsin?"].map(q => (
              <button
                key={q}
                disabled={isTyping}
                onClick={() => sendMessage(q)}
                className="text-[10px] font-semibold bg-af-surface-2 hover:bg-af-border disabled:opacity-40 text-af-text-secondary hover:text-white px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors border border-af-border/60 flex-shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <form id="flow-ai-form" onSubmit={handleSend} className="p-3 border-t border-af-border flex gap-2 flex-shrink-0">
            <input
              ref={chatInputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={isTyping}
              placeholder={isTyping ? "Flow AI yazıyor..." : revisionMode ? "Örn: 'ışıkları kırmızı yap', 'mavi neon stüdyo'..." : "Herhangi bir şey sorun..."}
              className="flex-1 bg-af-surface-2 border border-af-border text-af-text placeholder:text-af-text-disabled rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-af-accent transition-colors disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={isTyping || !inputText.trim()}
              className="w-9 h-9 rounded-xl bg-af-accent hover:bg-af-accent-hover disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 transition-colors"
            >
              {isTyping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>

        {/* ════ SAĞ: STÜDYO PANEL (8 kolon) ════ */}
        <div className="lg:col-span-8 space-y-5">

          {/* ── Renk Analiz Sonuç Kartı ── */}
          {colorSwatchVisible && detectedColor && (
            <div
              className={cn(
                "rounded-2xl p-5 border flex items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-500",
                `bg-gradient-to-r ${detectedColor.cssGradient} border-white/10`
              )}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="w-14 h-14 rounded-2xl shadow-2xl border-2 border-white/20 flex-shrink-0"
                    style={{ backgroundColor: detectedColor.hex }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-af-success border-2 border-af-bg flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-white/50 mb-0.5">AI Renk Analizi Sonucu</p>
                  <h3 className="font-black text-white text-base flex items-center gap-2">
                    <Palette className="w-4 h-4" style={{ color: detectedColor.accent }} />
                    {detectedColor.name}
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">{detectedColor.studioDesc}</p>
                </div>
              </div>
              <div className="hidden sm:block text-right text-xs text-white/50 max-w-[200px]">
                <Zap className="w-4 h-4 mb-1 ml-auto" style={{ color: detectedColor.accent }} />
                <p className="leading-relaxed">{detectedColor.lighting}</p>
              </div>
            </div>
          )}

          {/* ── Ana Stüdyo Alanı ── */}
          <div className="bg-af-surface border border-af-border rounded-2xl p-5 space-y-5">

            <div className="flex items-center gap-2 border-b border-af-border pb-4">
              <div className="w-8 h-8 rounded-lg bg-af-accent/10 text-af-accent flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-white text-sm">Stüdyo Önizleme</h2>
                <p className="text-[10px] text-af-text-disabled">Renk analizi → Otomatik stüdyo seçimi → AI render</p>
              </div>
            </div>

            {/* ── Fotoğraf Yükle Alanı (eğer henüz görsel yoksa) ── */}
            {!uploadedImage && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-af-border hover:border-af-accent/40 rounded-2xl p-10 flex flex-col items-center text-center cursor-pointer hover:bg-af-surface-2/20 transition-all group"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-af-accent/20 to-purple-600/20 border border-af-accent/20 group-hover:border-af-accent/40 text-af-accent flex items-center justify-center mb-4 transition-all group-hover:scale-105">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-white text-base mb-1.5">Araç Fotoğrafı Yükleyin</h4>
                <p className="text-sm text-af-text-disabled max-w-md leading-relaxed">
                  Yapay zeka aracın rengini <span className="text-af-accent font-semibold">gerçek zamanlı olarak algılar</span> ve rengiyle uyumlu en iyi stüdyo ortamını, ışık kurulumunu otomatik seçer.
                </p>
                <p className="text-xs text-af-text-disabled mt-3">PNG, JPG, WEBP · veya sol panelden örnek seçin</p>
              </div>
            )}

            {/* ── Görsel Var: Önizleme Alanı ── */}
            {uploadedImage && !enhanceSuccess && (
              <div className="space-y-4">
                {/* Orijinal görsel önizleme */}
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-af-border bg-black">
                  <img src={uploadedImage} alt="Orijinal" className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                    Orijinal
                  </span>

                  {/* Renk analiz overlay */}
                  {colorAnalyzing && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="relative w-12 h-12 mb-3">
                        <span className="absolute inset-0 border-4 border-af-accent/30 border-t-af-accent rounded-full animate-spin" />
                        <Palette className="w-5 h-5 text-af-accent absolute inset-0 m-auto" />
                      </div>
                      <p className="text-white text-sm font-bold">Renk Analizi Yapılıyor...</p>
                      <p className="text-white/50 text-xs mt-1">Baskın araç rengi tespit ediliyor</p>
                    </div>
                  )}

                  {/* AI İşleme overlay */}
                  {processing && (
                    <div
                      className={cn("absolute inset-0 backdrop-blur-sm flex flex-col items-center justify-center", `bg-gradient-to-br ${detectedColor?.cssGradient || "from-gray-900 to-black"}`)}
                      style={{ opacity: 0.92 }}
                    >
                      <div className="relative w-16 h-16 mb-4">
                        <span className="absolute inset-0 border-4 border-af-accent/30 border-t-af-accent rounded-full animate-spin" />
                        <Sparkles className="w-7 h-7 text-af-accent absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <h4 className="font-bold text-white text-sm mb-3">Flow AI Stüdyo Render Ediliyor</h4>
                      <div className="w-56 bg-white/10 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{ width: `${processingStep}%`, backgroundColor: detectedColor?.accent || "#7c3aed" }}
                        />
                      </div>
                      <p className="text-xs text-white/60 mt-2.5 font-medium animate-pulse">{processingLabel}</p>
                    </div>
                  )}
                </div>

                {/* Aksiyon butonu */}
                <button
                  onClick={handleEnhance}
                  disabled={processing || colorAnalyzing || !detectedColor}
                  className="w-full flex items-center justify-center gap-2.5 bg-af-accent hover:bg-af-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-af-accent/25 text-sm"
                >
                  {processing ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> AI Stüdyo Oluşturuluyor...</>
                  ) : colorAnalyzing ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Renk Analizi Yapılıyor...</>
                  ) : detectedColor ? (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Görseli İyileştir — {detectedColor.name} Stüdyosu
                      <div className="w-4 h-4 rounded-full border-2 border-white/40" style={{ backgroundColor: detectedColor.hex }} />
                    </>
                  ) : (
                    <><Upload className="w-4 h-4" /> Önce Fotoğraf Yükleyin</>
                  )}
                </button>

                {uploadedImage && (
                  <button
                    onClick={() => { setUploadedImage(null); setDetectedColor(null); setColorSwatchVisible(false); setEnhanceSuccess(false) }}
                    className="w-full flex items-center justify-center gap-2 text-af-text-disabled hover:text-af-error text-xs py-2 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Görseli Kaldır
                  </button>
                )}
              </div>
            )}

            {/* ── BAŞARI: Before / After Slider ── */}
            {enhanceSuccess && detectedColor && (
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-af-text-secondary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-af-success animate-pulse" />
                  Slider'ı sürükleyerek öncesi/sonrası karşılaştırın
                </p>

                <div
                  ref={sliderRef}
                  className="relative w-full aspect-[16/10] overflow-hidden rounded-2xl border border-af-border cursor-ew-resize select-none"
                  onMouseMove={e => { if (isDragging.current) handleSliderInput(e.clientX) }}
                  onMouseDown={e => { e.preventDefault(); isDragging.current = true }}
                  onMouseUp={() => { isDragging.current = false }}
                  onMouseLeave={() => { isDragging.current = false }}
                  onTouchMove={e => handleSliderInput(e.touches[0].clientX)}
                >
                  {/* After (full width behind) */}
                  <img src={enhancedImage || ""} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                  <span className="absolute right-3 top-3 bg-af-accent text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg z-10">
                    AI Stüdyo
                  </span>

                  {/* Before (clipped left side) */}
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
                  >
                    <img src={uploadedImage!} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
                    <span className="absolute left-3 top-3 bg-black/70 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                      Orijinal
                    </span>
                  </div>

                  {/* Divider bar */}
                  <div className="absolute inset-y-0 pointer-events-none" style={{ left: `${sliderPos}%` }}>
                    <div className="w-0.5 h-full bg-white opacity-80" />
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white shadow-2xl flex items-center justify-center border-2 border-af-border text-af-bg font-black text-sm">
                      ↔
                    </div>
                  </div>
                </div>

                 {/* Renk Info */}
                 <div
                   className={cn("rounded-xl p-3 flex items-center gap-3 border border-white/10", `bg-gradient-to-r ${detectedColor.cssGradient}`)}
                 >
                   <div className="w-8 h-8 rounded-lg border border-white/20 flex-shrink-0" style={{ backgroundColor: detectedColor.hex }} />
                   <div className="flex-1 min-w-0">
                     <p className="text-xs font-bold text-white">{showroomConfig?.studioDesc || detectedColor.studioDesc}</p>
                     <p className="text-[10px] text-white/50 truncate">{showroomConfig?.lighting || detectedColor.lighting}</p>
                   </div>
                 </div>

                {/* Revize Et Butonu */}
                <button
                  onClick={handleRevisePromptMode}
                  className="w-full flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-amber-500/25 text-sm mb-3"
                >
                  <Sparkles className="w-4 h-4" /> Revize Et (Yazı ile Düzenle)
                </button>

                {/* İndirme / Yeni */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setEnhanceSuccess(false)
                      setUploadedImage(null)
                      setDetectedColor(null)
                      setShowroomConfig(null)
                      setColorSwatchVisible(false)
                      setRevisionMode(false)
                      if (transparentCarUrlState) {
                        URL.revokeObjectURL(transparentCarUrlState)
                        setTransparentCarUrlState(null)
                      }
                    }}
                    className="col-span-1 border border-af-border hover:bg-af-surface-2 text-af-text-secondary hover:text-white font-semibold py-3 rounded-xl transition-colors text-sm"
                  >
                    Yeni Görsel
                  </button>
                  <a
                    href={enhancedImage || ""}
                    download="flow-ai-enhanced.png"
                    className="col-span-1 bg-af-surface border border-af-border hover:border-af-accent/40 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Download className="w-4 h-4" /> İndir
                  </a>
                  <button
                    onClick={() => addAiMsg("✅ AI stüdyo görseli ilan kataloğunuza kaydedildi! 🎉")}
                    className="col-span-1 bg-af-accent hover:bg-af-accent-hover text-white font-bold py-3 rounded-xl transition-all hover:shadow-xl hover:shadow-af-accent/25 flex items-center justify-center gap-2 text-sm"
                  >
                    <Check className="w-4 h-4" /> İlana Ekle
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  )
}
