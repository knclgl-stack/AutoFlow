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
  bgStyle: "classic" | "garage" | "sunset" | "minimalist" | "scifi" | "dealer"
  censorPlate: boolean
  lightPanelOpacity: number
  name: string
  studioDesc: string
  lighting: string
  dealerName?: string
  dealerLogoUrl?: string
  carScale?: number
  plateXPercent?: number
  plateYPercent?: number
  plateWPercent?: number
  plateHPercent?: number
  carColorEn?: string
  shadowOpacity?: number
  shadowOffsetY?: number
  shadowScaleX?: number
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
  // Pre-load dealer logo if url exists
  let logoImg: HTMLImageElement | null = null
  if (config.dealerLogoUrl) {
    logoImg = new Image()
    logoImg.crossOrigin = "anonymous"
    logoImg.src = config.dealerLogoUrl
    await new Promise((res) => {
      logoImg!.onload = () => res(true)
      logoImg!.onerror = () => {
        logoImg = null
        res(false)
      }
    })
  }

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

      if (config.bgStyle === "dealer") {
        // Off-white/Light-grey wall base with concrete panel textures
        const wallGrad = ctx.createLinearGradient(0, 0, 0, horizonY)
        wallGrad.addColorStop(0, "#d1d1d4") // darker at the top (ceiling shadow)
        wallGrad.addColorStop(0.3, "#dbdbde")
        wallGrad.addColorStop(0.85, "#e8e8eb")
        wallGrad.addColorStop(1, "#dfdfe2") // slight drop shadow at the horizon curve
        ctx.fillStyle = wallGrad
        ctx.fillRect(0, 0, W, horizonY)

        // Draw vertical concrete panel lines on the wall to break the void
        ctx.strokeStyle = "rgba(0, 0, 0, 0.05)"
        ctx.lineWidth = 1
        const panelW = W / 4
        for (let i = 1; i < 4; i++) {
          ctx.beginPath()
          ctx.moveTo(i * panelW, 0)
          ctx.lineTo(i * panelW, horizonY)
          ctx.stroke()
        }
        
        // Faint horizontal seams to make it look like constructed concrete panel walls
        ctx.beginPath()
        ctx.moveTo(0, horizonY * 0.4)
        ctx.lineTo(W, horizonY * 0.4)
        ctx.stroke()

        // Ceiling Shadow vignette (makes it feel enclosed)
        const ceilingGlow = ctx.createLinearGradient(0, 0, 0, horizonY * 0.5)
        ceilingGlow.addColorStop(0, "rgba(0, 0, 0, 0.28)") // dark ceiling corner
        ceilingGlow.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = ceilingGlow
        ctx.fillRect(0, 0, W, horizonY * 0.5)

        // Side wall shadows (vignette on left and right edges)
        const sideGlow = ctx.createRadialGradient(
          W / 2, horizonY / 2, W * 0.3,
          W / 2, horizonY / 2, W * 0.75
        )
        sideGlow.addColorStop(0, "rgba(0, 0, 0, 0)")
        sideGlow.addColorStop(1, "rgba(0, 0, 0, 0.16)")
        ctx.fillStyle = sideGlow
        ctx.fillRect(0, 0, W, horizonY)

        const curveGrad = ctx.createLinearGradient(0, horizonY - H * 0.08, 0, horizonY)
        curveGrad.addColorStop(0, "rgba(0, 0, 0, 0)")
        curveGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.04)")
        curveGrad.addColorStop(1, "rgba(0, 0, 0, 0.15)") // dark occlusion where floor meets wall
        ctx.fillStyle = curveGrad
        ctx.fillRect(0, horizonY - H * 0.08, W, H * 0.08)
      } else if (config.bgStyle === "sunset") {
        const wallGrad = ctx.createLinearGradient(0, 0, 0, horizonY)
        wallGrad.addColorStop(0, "#080210") // twilight purple
        wallGrad.addColorStop(0.4, "#2e061b") // magenta tint
        wallGrad.addColorStop(0.7, "#a62429") // sunset red
        wallGrad.addColorStop(1, "#d98b1e") // sunset orange/yellow
        ctx.fillStyle = wallGrad
        ctx.fillRect(0, 0, W, horizonY)
      } else {
        const wallGrad = ctx.createLinearGradient(0, 0, 0, horizonY)
        wallGrad.addColorStop(0, "#050507")
        wallGrad.addColorStop(0.7, "#0c0c10")
        wallGrad.addColorStop(1, config.bg)
        ctx.fillStyle = wallGrad
        ctx.fillRect(0, 0, W, horizonY)

        // Soft radial glow on the back wall behind the car to create 3D depth
        ctx.save()
        const glowCX = W / 2
        const wallGlow = ctx.createRadialGradient(
          glowCX, horizonY - H * 0.1, 0,
          glowCX, horizonY - H * 0.1, W * 0.4
        )
        wallGlow.addColorStop(0, `rgba(${accentRgb}, 0.15)`)
        wallGlow.addColorStop(0.5, `rgba(${accentRgb}, 0.04)`)
        wallGlow.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = wallGlow
        ctx.beginPath()
        ctx.arc(glowCX, horizonY - H * 0.1, W * 0.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // Draw garage style pillars on the wall
      if (config.bgStyle === "garage") {
        ctx.save()
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)"
        const pillarWidth = W * 0.08
        const pillarSpacing = W * 0.25
        for (let x = pillarSpacing / 2; x < W; x += pillarSpacing) {
          ctx.fillRect(x, 0, pillarWidth, horizonY)
          ctx.fillStyle = "rgba(255, 255, 255, 0.02)"
          ctx.fillRect(x + pillarWidth - 2, 0, 2, horizonY)
          ctx.fillStyle = "rgba(0, 0, 0, 0.35)"
        }
        ctx.restore()
      }

      // Draw Sci-Fi intersecting laser lines
      if (config.bgStyle === "scifi") {
        ctx.save()
        ctx.strokeStyle = `rgba(${accentRgb}, 0.5)`
        ctx.lineWidth = Math.max(2.5, H * 0.005)
        ctx.shadowColor = `rgba(${accentRgb}, 0.8)`
        ctx.shadowBlur = 15
        
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(W * 0.45, horizonY)
        ctx.moveTo(W, 0)
        ctx.lineTo(W * 0.55, horizonY)
        ctx.moveTo(0, horizonY - H * 0.3)
        ctx.lineTo(W, horizonY - H * 0.3)
        ctx.stroke()
        ctx.restore()
      }

      // 2. Glowing LED Lines / Neon strips on the Wall (classic style only)
      if (config.showNeonStrips && config.bgStyle === "classic") {
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

      // Draw dealer logo/brand on the back wall (higher up to prevent roof overlap)
      if (config.bgStyle === "dealer") {
        const logoY = H * 0.16
        const logoText = (config.dealerName || "AUTOFLOW").toUpperCase()
        
        if (logoImg) {
          ctx.save()
          const logoW = W * 0.18
          const logoH = logoW * (logoImg.naturalHeight / logoImg.naturalWidth)
          ctx.drawImage(logoImg, W / 2 - logoW / 2, logoY - logoH / 2, logoW, logoH)
          ctx.restore()
        } else {
          // Draw a premium dealer vector emblem (wings + text)
          ctx.save()
          
          // 1. Wings emblem in deep sapphire blue chrome
          ctx.strokeStyle = "#1e3a8a" // deep blue border
          ctx.fillStyle = "#2563eb"   // bright royal blue fill
          ctx.lineWidth = 2
          
          // Center circle/shield for initials
          const circleR = Math.max(12, H * 0.024)
          ctx.beginPath()
          ctx.arc(W / 2, logoY - circleR, circleR, 0, Math.PI * 2)
          ctx.stroke()
          
          // Inner circle/shield fill
          ctx.beginPath()
          ctx.arc(W / 2, logoY - circleR, circleR - 4, 0, Math.PI * 2)
          ctx.fill()
          
          // Initials inside circle/shield
          ctx.fillStyle = "#ffffff"
          const initials = logoText.substring(0, 2)
          ctx.font = `bold ${circleR * 0.85}px sans-serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(initials, W / 2, logoY - circleR)
          
          // Draw wings lines in bright blue chrome
          ctx.strokeStyle = "#3b82f6"
          ctx.lineWidth = 3
          // Left wing
          ctx.beginPath()
          ctx.moveTo(W / 2 - circleR - 4, logoY - circleR)
          ctx.lineTo(W / 2 - circleR - 40, logoY - circleR - 8)
          ctx.lineTo(W / 2 - circleR - 10, logoY - circleR + 2)
          ctx.stroke()
          
          ctx.beginPath()
          ctx.moveTo(W / 2 - circleR - 8, logoY - circleR + 4)
          ctx.lineTo(W / 2 - circleR - 35, logoY - circleR - 1)
          ctx.lineTo(W / 2 - circleR - 12, logoY - circleR + 8)
          ctx.stroke()

          // Right wing
          ctx.beginPath()
          ctx.moveTo(W / 2 + circleR + 4, logoY - circleR)
          ctx.lineTo(W / 2 + circleR + 40, logoY - circleR - 8)
          ctx.lineTo(W / 2 + circleR + 10, logoY - circleR + 2)
          ctx.stroke()
          
          ctx.beginPath()
          ctx.moveTo(W / 2 + circleR + 8, logoY - circleR + 4)
          ctx.lineTo(W / 2 + circleR + 35, logoY - circleR - 1)
          ctx.lineTo(W / 2 + circleR + 12, logoY - circleR + 8)
          ctx.stroke()
          
          // 2. Logo text underneath in deep royal serif blue
          ctx.fillStyle = "#1e3a8a"
          const fontSize = Math.max(12, Math.floor(H * 0.028))
          ctx.font = `bold italic ${fontSize}px Georgia, serif`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(logoText, W / 2, logoY + circleR * 0.8)
          
          ctx.restore()
        }
      }

      // 3. Showroom Floor background gradient (reflective showroom floor)
      const floorGrad = ctx.createLinearGradient(0, horizonY, 0, H)
      if (config.bgStyle === "dealer") {
        // Darker concrete floor gradient for high contrast
        floorGrad.addColorStop(0, "#b0b0b4") // soft horizon intersection
        floorGrad.addColorStop(0.12, "#98989c") // mid floor
        floorGrad.addColorStop(1, "#7c7c80") // darker foreground for professional depth vignette
      } else if (config.bgStyle === "sunset") {
        floorGrad.addColorStop(0, "#c46a12") // warm sunset reflection color
        floorGrad.addColorStop(0.3, "#1a0803")
        floorGrad.addColorStop(1, "#030202")
      } else {
        floorGrad.addColorStop(0, config.floorColor)
        floorGrad.addColorStop(0.3, "#060608")
        floorGrad.addColorStop(1, "#020203")
      }
      ctx.fillStyle = floorGrad
      ctx.fillRect(0, horizonY, W, H - horizonY)

      if (config.bgStyle === "dealer") {
        // Soft gradient overlay matching the car's theme tint
        ctx.fillStyle = `rgba(${accentRgb}, 0.03)`
        ctx.fillRect(0, horizonY, W, H - horizonY)

        // Horizon curved ambient occlusion shadow on the floor
        const floorCurveGrad = ctx.createLinearGradient(0, horizonY, 0, horizonY + H * 0.06)
        floorCurveGrad.addColorStop(0, "rgba(0, 0, 0, 0.16)")
        floorCurveGrad.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = floorCurveGrad
        ctx.fillRect(0, horizonY, W, H * 0.06)
      }

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

      // 5. Overhead Light Panels (Reflected on the Floor) - Diffused with soft blur filter
      if (config.lightPanelOpacity > 0) {
        ctx.save()
        ctx.filter = "blur(15px)"

        // Left panel reflection
        const leftRef = ctx.createLinearGradient(W * 0.25, horizonY, W * 0.25, H)
        leftRef.addColorStop(0, `rgba(${leftPanelRgb}, ${config.lightPanelOpacity})`)
        leftRef.addColorStop(0.5, `rgba(${leftPanelRgb}, ${config.lightPanelOpacity * 0.3})`)
        leftRef.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = leftRef
        ctx.fillRect(W * 0.15, horizonY, W * 0.2, H - horizonY)

        // Right panel reflection
        const rightRef = ctx.createLinearGradient(W * 0.75, horizonY, W * 0.75, H)
        rightRef.addColorStop(0, `rgba(${rightPanelRgb}, ${config.lightPanelOpacity})`)
        rightRef.addColorStop(0.5, `rgba(${rightPanelRgb}, ${config.lightPanelOpacity * 0.3})`)
        rightRef.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = rightRef
        ctx.fillRect(W * 0.65, horizonY, W * 0.2, H - horizonY)

        ctx.restore()
        ctx.filter = "none"
      }

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

      // 6.5 Dynamic scale & offset calculation to prevent cramped close-ups!
      const targetScale = config.carScale || 0.70
      const targetCarW = W * targetScale
      const scale = targetCarW / carW

      const drawW = W * scale
      const drawH = H * scale
      const drawX = W / 2 - carCX * scale
      
      // FIX: Force the bottom of the tires to align with a fixed position on the floor grid (targetTireY)
      // Moving it slightly lower (0.65 instead of 0.58) gives more floor space behind the car.
      const targetTireY = horizonY + (H - horizonY) * 0.65
      const drawY = targetTireY - carBottomY * scale
      const carWidthReal = (normMaxX - normMinX) * drawW

      // A. Soft cyclorama gradient to blur the horizon line and blend wall into floor (creates 3D curve depth)
      ctx.save()
      const cycGrad = ctx.createLinearGradient(0, horizonY - H * 0.08, 0, horizonY + H * 0.08)
      cycGrad.addColorStop(0, "rgba(0, 0, 0, 0)")
      cycGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.06)")
      cycGrad.addColorStop(1, "rgba(0, 0, 0, 0)")
      ctx.fillStyle = cycGrad
      ctx.fillRect(0, horizonY - H * 0.08, W, H * 0.16)
      ctx.restore()
      // Get dynamic shadow attributes set by AI or default values
      const shOpacity = config.shadowOpacity !== undefined ? config.shadowOpacity : 0.60
      const shOffsetY = config.shadowOffsetY !== undefined ? config.shadowOffsetY : 0
      const shScaleX = config.shadowScaleX !== undefined ? config.shadowScaleX : 1.0

      // Draw volumetric spotlight cone (aligned with scaled car center)
      if (config.showSpotlight) {
        ctx.save()
        const lightBeam = ctx.createLinearGradient(W / 2, 0, W / 2, targetTireY)
        lightBeam.addColorStop(0, `rgba(${spotlightRgb}, 0.22)`)
        lightBeam.addColorStop(0.5, `rgba(${spotlightRgb}, 0.08)`)
        lightBeam.addColorStop(1, "rgba(0, 0, 0, 0)")
        ctx.fillStyle = lightBeam
        ctx.beginPath()
        
        const wFactor = config.spotlightWidth
        const scaledCarW = carW * scale
        ctx.moveTo(W / 2 - scaledCarW * 0.15 * wFactor, 0)
        ctx.lineTo(W / 2 + scaledCarW * 0.15 * wFactor, 0)
        ctx.lineTo(W / 2 + scaledCarW * 0.65 * wFactor, targetTireY)
        ctx.lineTo(W / 2 - scaledCarW * 0.65 * wFactor, targetTireY)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }

      // Draw floor-contact elements (reflection, shadows) CLIPPED strictly to the floor area (prevents bleeding onto the wall)
      ctx.save()
      ctx.beginPath()
      ctx.rect(0, horizonY, W, H - horizonY)
      ctx.clip()

      // 7. Floor Reflection (flipped car) - Soft blurred glossy reflection! (Aligned with scaled car)
      if (config.reflectionOpacity > 0) {
        const reflectionHeight = carH * scale * 0.35
        
        // Create a temporary canvas for the reflection to apply a gradient mask
        const refCanvas = document.createElement("canvas")
        refCanvas.width = W
        refCanvas.height = reflectionHeight
        const refCtx = refCanvas.getContext("2d")!
        
        // Draw the flipped car on the temp canvas, aligned perfectly to the bottom of the tires
        refCtx.save()
        refCtx.translate(0, 0.28 * targetTireY)
        refCtx.scale(1, -0.28)
        refCtx.drawImage(img, drawX, drawY, drawW, drawH)
        refCtx.restore()
        
        // Apply gradient mask to fade the reflection naturally to transparent (no solid overlay block!)
        refCtx.save()
        refCtx.globalCompositeOperation = "destination-in"
        const maskGrad = refCtx.createLinearGradient(0, 0, 0, reflectionHeight)
        maskGrad.addColorStop(0, `rgba(0, 0, 0, ${config.reflectionOpacity * 1.5})`)
        maskGrad.addColorStop(0.3, `rgba(0, 0, 0, ${config.reflectionOpacity * 0.8})`)
        maskGrad.addColorStop(1, "rgba(0, 0, 0, 0)")
        refCtx.fillStyle = maskGrad
        refCtx.fillRect(0, 0, W, reflectionHeight)
        refCtx.restore()
        
        // Draw the faded reflection onto the main canvas with a beautiful glossy blur
        ctx.save()
        ctx.filter = "blur(6px)"
        ctx.drawImage(refCanvas, 0, targetTireY)
        ctx.restore()
      }

      // 8. Multi-Layer Contact Shadows (Grounds the tires and chassis realistically)
      
      // Layer A: Soft, wide ambient occlusion shadow (simulates blocking general room light)
      const softAmbientShadow = ctx.createRadialGradient(
        W / 2, targetTireY - 2 + shOffsetY, 0,
        W / 2, targetTireY - 2 + shOffsetY, carWidthReal * 0.58 * shScaleX
      )
      softAmbientShadow.addColorStop(0, `rgba(0, 0, 0, ${shOpacity})`)
      softAmbientShadow.addColorStop(0.4, `rgba(0, 0, 0, ${shOpacity * 0.5})`)
      softAmbientShadow.addColorStop(0.8, `rgba(0, 0, 0, ${shOpacity * 0.12})`)
      softAmbientShadow.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.save()
      ctx.translate(W / 2, targetTireY + shOffsetY)
      ctx.scale(1.15 * shScaleX, 0.075)
      ctx.fillStyle = softAmbientShadow
      ctx.beginPath()
      ctx.arc(0, 0, carWidthReal * 0.58, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Layer B: Main chassis block shadow (darker, flatter shadow directly under the car length)
      const chassisShadow = ctx.createRadialGradient(
        W / 2, targetTireY + shOffsetY, 0,
        W / 2, targetTireY + shOffsetY, carWidthReal * 0.46 * shScaleX
      )
      chassisShadow.addColorStop(0, `rgba(0, 0, 0, ${shOpacity * 1.4})`)
      chassisShadow.addColorStop(0.5, `rgba(0, 0, 0, ${shOpacity * 0.9})`)
      chassisShadow.addColorStop(0.8, `rgba(0, 0, 0, ${shOpacity * 0.25})`)
      chassisShadow.addColorStop(1, "rgba(0, 0, 0, 0)")

      ctx.save()
      ctx.translate(W / 2, targetTireY + shOffsetY)
      ctx.scale(1.22 * shScaleX, 0.038) // slightly longer and flatter than ambient
      ctx.fillStyle = chassisShadow
      ctx.beginPath()
      ctx.arc(0, 0, carWidthReal * 0.46, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Layer C: Tire Footprint Contact Shadows (very dark, small ellipses directly under the tires)
      const wheelXPositions = [
        W / 2 - carWidthReal * 0.28, // Left wheel region
        W / 2 + carWidthReal * 0.28  // Right wheel region
      ]
      
      wheelXPositions.forEach((wheelX) => {
        const tireShadow = ctx.createRadialGradient(
          wheelX, targetTireY + shOffsetY, 0,
          wheelX, targetTireY + shOffsetY, carWidthReal * 0.10
        )
        tireShadow.addColorStop(0, `rgba(0, 0, 0, ${shOpacity * 1.5})`)
        tireShadow.addColorStop(0.25, `rgba(0, 0, 0, ${shOpacity * 1.3})`)
        tireShadow.addColorStop(0.6, `rgba(0, 0, 0, ${shOpacity * 0.6})`)
        tireShadow.addColorStop(1, "rgba(0, 0, 0, 0)")

        ctx.save()
        ctx.translate(wheelX, targetTireY + shOffsetY)
        ctx.scale(1.0, 0.045) // Squashed to match the tire's ground contact patch
        ctx.fillStyle = tireShadow
        ctx.beginPath()
        ctx.arc(0, 0, carWidthReal * 0.10, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      ctx.restore() // Close floor clip
      // 8.5 Subtle Edge Softener / Anti-Aliasing (reduces pixelated background-removal artifacts)
      ctx.save()
      ctx.filter = "blur(1px)"
      ctx.globalAlpha = 0.08 // minimal opacity to prevent halo/glow artifacts
      ctx.drawImage(img, drawX, drawY, drawW, drawH)
      ctx.restore()
      ctx.filter = "none"

      // 8.7 Soft ambient backlight bloom behind the car silhouette (blends the edges with the bright wall)
      if (config.bgStyle === "dealer") {
        ctx.save()
        ctx.filter = "blur(20px)"
        ctx.globalAlpha = 0.16
        ctx.fillStyle = "#ffffff"
        ctx.beginPath()
        // Draw a soft glowing shape behind the car body/roof to bleed the bright background over the silhouette
        ctx.ellipse(W / 2, drawY + drawH * 0.5, carWidthReal * 0.45, drawH * 0.22, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // 9. Draw original scaled car on top
      ctx.drawImage(img, drawX, drawY, drawW, drawH)

      // 9.5 Ambient Color Matching & Studio Highlights (masked to car silhouette)
      ctx.save()
      ctx.globalCompositeOperation = "source-atop"
      
      // A. Ambient Room Tint Overlay (blends the car into the studio's color temperature)
      if (config.bgStyle === "sunset") {
        // Warm sunset orange/red ambient light wrap
        const sunsetTint = ctx.createLinearGradient(drawX + drawW, drawY, drawX, drawY + drawH)
        sunsetTint.addColorStop(0, "rgba(217, 139, 30, 0.15)") // orange glow from top right
        sunsetTint.addColorStop(0.5, "rgba(166, 36, 41, 0.08)") // red mid-body warmth
        sunsetTint.addColorStop(1, "rgba(26, 8, 3, 0.12)")      // dark warm floor reflection
        ctx.fillStyle = sunsetTint
        ctx.fillRect(drawX, drawY, drawW, drawH)
      } else if (config.bgStyle === "scifi" || config.bgStyle === "classic" && config.accent === "#3399ff") {
        // Cool electric blue glow
        const blueTint = ctx.createLinearGradient(drawX, drawY, drawX + drawW, drawY + drawH)
        blueTint.addColorStop(0, "rgba(51, 153, 255, 0.14)")  // neon blue highlights
        blueTint.addColorStop(1, "rgba(5, 10, 26, 0.12)")     // indigo shadow tint
        ctx.fillStyle = blueTint
        ctx.fillRect(drawX, drawY, drawW, drawH)
      } else if (config.carColorEn === "white" || config.name?.toLowerCase().includes("beyaz") || config.name?.toLowerCase().includes("gümüş")) {
        // Soft white studio warmth / soft box tint
        const whiteStudioTint = ctx.createLinearGradient(0, drawY, 0, drawY + drawH)
        whiteStudioTint.addColorStop(0, "rgba(192, 160, 96, 0.04)") // warm gold accent lighting
        whiteStudioTint.addColorStop(1, "rgba(240, 240, 240, 0.03)")
        ctx.fillStyle = whiteStudioTint
        ctx.fillRect(drawX, drawY, drawW, drawH)
      } else if (config.carColorEn === "black" || config.name?.toLowerCase().includes("siyah") || config.name?.toLowerCase().includes("antrasit")) {
        // Cool metallic grey reflection for black studio
        const blackStudioTint = ctx.createLinearGradient(0, drawY, 0, drawY + drawH)
        blackStudioTint.addColorStop(0, "rgba(255, 255, 255, 0.03)")
        blackStudioTint.addColorStop(1, "rgba(10, 10, 15, 0.10)") // cool shadow grounding
        ctx.fillStyle = blackStudioTint
        ctx.fillRect(drawX, drawY, drawW, drawH)
      }

      // B. Glossy Softbox Highlights (using "overlay" blend mode for paint interaction, not flat white paint)
      ctx.globalCompositeOperation = "overlay"
      
      // Slanted left metallic softbox reflection
      const leftLight = ctx.createLinearGradient(drawX, drawY, drawX + drawW * 0.4, drawY)
      leftLight.addColorStop(0, "rgba(255, 255, 255, 0.22)")
      leftLight.addColorStop(0.5, "rgba(255, 255, 255, 0.08)")
      leftLight.addColorStop(1, "rgba(255, 255, 255, 0)")
      ctx.fillStyle = leftLight
      ctx.fillRect(drawX, drawY, drawW * 0.4, drawH)
      
      // Slanted right metallic softbox reflection
      const rightLight = ctx.createLinearGradient(drawX + drawW * 0.6, drawY, drawX + drawW, drawY)
      rightLight.addColorStop(0, "rgba(255, 255, 255, 0)")
      rightLight.addColorStop(0.5, "rgba(255, 255, 255, 0.08)")
      rightLight.addColorStop(1, "rgba(255, 255, 255, 0.22)")
      ctx.fillStyle = rightLight
      ctx.fillRect(drawX + drawW * 0.6, drawY, drawW * 0.4, drawH)

      // Overhead softbox reflection (highlights hood, roof, trunk)
      const overheadLight = ctx.createLinearGradient(0, drawY, 0, drawY + drawH * 0.35)
      overheadLight.addColorStop(0, "rgba(255, 255, 255, 0.28)")
      overheadLight.addColorStop(0.5, "rgba(255, 255, 255, 0.10)")
      overheadLight.addColorStop(1, "rgba(255, 255, 255, 0)")
      ctx.fillStyle = overheadLight
      ctx.fillRect(drawX, drawY, drawW, drawH * 0.35)
      
      ctx.restore()
      ctx.globalCompositeOperation = "source-over" // reset

      // 10. Optional License Plate Censor (Draggable & Realistic Turkish Dealer Plate Design)
      if (config.censorPlate) {
        ctx.save()
        // Use relative percent positions if supplied, otherwise fallback to bumper center
        const plateW = config.plateWPercent !== undefined ? (config.plateWPercent / 100) * W : carW * scale * 0.18
        const plateH = config.plateHPercent !== undefined ? (config.plateHPercent / 100) * H : plateW * 0.22
        const plateX = config.plateXPercent !== undefined ? (config.plateXPercent / 100) * W : W / 2 - plateW / 2
        const plateY = config.plateYPercent !== undefined ? (config.plateYPercent / 100) * H : carBottomY - carH * scale * 0.13

        // Draw plate shadow
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)"
        ctx.shadowBlur = 6
        ctx.shadowOffsetY = 2

        // Draw plate background (glossy black plate holder frame)
        ctx.fillStyle = "#111112"
        ctx.strokeStyle = "#333336"
        ctx.lineWidth = 1.5
        
        // Rounded rect for plate
        const radius = Math.max(2, plateH * 0.1)
        ctx.beginPath()
        ctx.roundRect(plateX, plateY, plateW, plateH, radius)
        ctx.fill()
        ctx.stroke()
        ctx.shadowBlur = 0 // reset shadow

        // Inner glowing border or accent line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.12)"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(plateX + 1.5, plateY + 1.5, plateW - 3, plateH - 3, radius)
        ctx.stroke()

        // TR Blue stripe on the left
        const blueW = plateW * 0.078
        ctx.fillStyle = "#003399" // EU/TR Blue
        ctx.beginPath()
        ctx.roundRect(plateX + 1.5, plateY + 1.5, blueW, plateH - 3, { tl: radius - 1, bl: radius - 1, tr: 0, br: 0 } as any)
        ctx.fill()

        // "TR" Text inside blue stripe
        ctx.fillStyle = "#ffffff"
        const trFontSize = Math.max(4, Math.floor(plateH * 0.38))
        ctx.font = `bold ${trFontSize}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("TR", plateX + 1.5 + blueW / 2, plateY + plateH * 0.65)

        // Brand Name on the black area (centered in the remaining width)
        ctx.fillStyle = "#f5f5f7"
        const fontSize = Math.max(6, Math.floor(plateH * 0.48))
        ctx.font = `bold ${fontSize}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        
        const text = (config.dealerName || "AUTOFLOW").toUpperCase()
        const textX = plateX + 1.5 + blueW + (plateW - 3 - blueW) / 2
        ctx.fillText(text, textX, plateY + plateH / 2 + 1)
        ctx.restore()
      }

      // 11. Professional Camera Vignette & Contrast Polish (ties the background and foreground together)
      ctx.save()
      const vignette = ctx.createRadialGradient(
        W / 2, H / 2, W * 0.45,
        W / 2, H / 2, W * 0.82
      )
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)")
      vignette.addColorStop(0.5, "rgba(0, 0, 0, 0.04)")
      vignette.addColorStop(1, "rgba(0, 0, 0, 0.26)") // subtle dark border
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, W, H)
      ctx.restore()

      resolve(canvas.toDataURL("image/png"))
    }

    img.onerror = () => reject(new Error("Görsel yüklenemedi."))
    img.src = transparentCarUrl
  })
}

function makeDefaultConfig(colorProfile: CarColor, dealerName?: string, dealerLogoUrl?: string): ShowroomConfig {
  return {
    bg: colorProfile.bg,
    floorColor: colorProfile.bg,
    accent: colorProfile.accent,
    spotlightColor: colorProfile.accent,
    leftPanelColor: colorProfile.accent,
    rightPanelColor: colorProfile.accent,
    gridColor: colorProfile.accent,
    reflectionOpacity: 0.16,
    spotlightWidth: 0.65,
    showNeonStrips: false,
    showSpotlight: false,
    showFloorGrid: false,
    bgStyle: "dealer",
    censorPlate: false,
    lightPanelOpacity: 0.1,
    name: colorProfile.name,
    studioDesc: "Bayi Stüdyosu",
    lighting: "Yumuşak softbox aydınlatması ve bayi logosu ile profesyonel çekim stüdyosu",
    dealerName: dealerName || "AUTOFLOW",
    dealerLogoUrl: dealerLogoUrl || undefined,
    carScale: 0.70,
    carColorEn: colorProfile.nameEn,
    shadowOpacity: 0.60,
    shadowOffsetY: 0,
    shadowScaleX: 1.0
  }
}

/* ─────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────── */
export default function FlowAiPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [dbPlan, setDbPlan] = useState("Essential")
  const [dealerName, setDealerName] = useState<string>("AUTOFLOW")
  const [dealerLogoUrl, setDealerLogoUrl] = useState<string | null>(null)

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
  const [downsizedImageBase64, setDownsizedImageBase64] = useState<string | null>(null)

  /* --- Chat AI State --- */
  const [isTyping, setIsTyping] = useState(false)
  const [userApiKey, setUserApiKey] = useState("")
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
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

  // Planı ve Galeri Bilgilerini Supabase'den çek
  useEffect(() => {
    if (!user) return
    async function planYukle() {
      if (!user) return
      const { data } = await supabase
        .from("galeri_profilleri")
        .select("plan, galeri_adi, logo_url")
        .eq("user_id", user.id)
        .single()
      if (data) {
        if (data.plan) setDbPlan(data.plan)
        if (data.galeri_adi) setDealerName(data.galeri_adi)
        if (data.logo_url) setDealerLogoUrl(data.logo_url)
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
        text: `Merhaba! Ben Flow AI. 🎨\n\n${planText}\n\nAraç fotoğrafınızı stüdyoya yerleştirmek için önce fotoğrafı yükleyin, ardından istediğiniz stüdyo tarzını bana yazın!`,
        timestamp: now()
      }
    ])
  }, [dbPlan])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mesajlar])

  /* ── Otomatik Renk Algılama & Stüdyo Sentezi ── */
  const analyzeAndEnhanceImage = async (imageUrl: string, userPrompt?: string) => {
    if (dbPlan === "Essential") {
      addAiMsg("⚠️ Essentials planındasınız. Akıllı Stüdyo özelliklerini kullanabilmek için lütfen Professional veya Elite plana geçin.")
      return
    }

    setColorAnalyzing(true)
    setProcessing(true)
    setProcessingStep(10)
    setProcessingLabel("Araç rengi ve kadraj açısı analiz ediliyor...")

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = async () => {
      // 1. Baskın renk tespiti ve alt-boyutlandırma
      const canvas = canvasRef.current!
      const W = Math.min(img.width, 400), H = Math.min(img.height, 400)
      canvas.width = W; canvas.height = H
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, W, H)
      const { data } = ctx.getImageData(0, 0, W, H)
      const profile = detectDominantCarColor(data, W, H)
      setDetectedColor(profile)
      
      const defaultConfig = makeDefaultConfig(profile, dealerName, dealerLogoUrl || undefined)
      setShowroomConfig(defaultConfig)
      setColorSwatchVisible(true)
      setColorAnalyzing(false)
      
      let base64Image = null
      try {
        base64Image = canvas.toDataURL("image/png")
        setDownsizedImageBase64(base64Image)
      } catch (err) {
        console.warn("Could not capture downsized base64:", err)
      }

      // 2. Arka plan silme ve stüdyo birleştirme
      try {
        setProcessingStep(30)
        setProcessingLabel("Yapay zeka stüdyo motoru indiriliyor...")
        
        const imgly = await eval("import('https://cdn.jsdelivr.net/npm/@imgly/background-removal/+esm')")
        
        setProcessingStep(55)
        setProcessingLabel("Araç hatları maskeleniyor ve arka plan siliniyor...")
        
        const processedBlob = await imgly.removeBackground(imageUrl)
        const transparentCarUrl = URL.createObjectURL(processedBlob)
        setTransparentCarUrlState(transparentCarUrl)

        setProcessingStep(75)
        setProcessingLabel("Stüdyo ışıkları ve yansımalar tasarlanıyor...")

        let finalConfig = defaultConfig

        if (base64Image) {
          try {
            const mimeType = base64Image.split(";")[0].split(":")[1]
            const base64Data = base64Image.split(",")[1]

            const aiPrompt = `Sen profesyonel bir stüdyo fotoğrafçılığı ve araba aydınlatma uzmanı olan Flow AI'sın.
Sana gönderilen araç görselini analiz et. 
Aracın rengini ve kameraya göre çekiş açısını (örneğin: ön-çapraz 3/4, tam yan profil, düz ön, arka-çapraz) belirle.

Bu analizine dayanarak, araba için en iyi aydınlatma, zemin yansıması, tepe spotlight'ı ve duvar rengi ayarlarını hesapla.

Kurallar:
1. ARKA PLAN RENGİ (bg): Aracın rengiyle doğrudan çakışmamalı, onunla şık bir kontrast oluşturmalı veya tamamlayıcı olmalıdır.
2. IŞIK AÇILARI VE REFEKSİYONLAR:
   - Araç ön-çapraz 3/4 veya düz ön ise tepe spotlight'ını geniş tut (spotlightWidth: 0.95), zemin yansımasını (reflectionOpacity) 0.20-0.25 arası yap.
   - Araç tam yan profil ise zemin yansımasını daha ayna gibi yap (reflectionOpacity: 0.35), neon şeritleri açarak araca derinlik kat (showNeonStrips: true).
3. GÖLGELER VE FİZİKSEL UYUMLULUK:
   - Işığın geliş yönünü düşünerek gölge opaklığını (shadowOpacity: 0.4 ile 0.9 arası), gölge dikey kaymasını (shadowOffsetY: -8 ile 12 arası piksel) ve gölge yatay genişliğini (shadowScaleX: 0.8 ile 1.3 arası) hassas şekilde ayarla.
4. Çıktı sadece JSON formatında olmalı.

{
  "bg": "duvar rengi hex kodu",
  "floorColor": "zemin rengi hex kodu",
  "accent": "neon şerit rengi hex kodu",
  "spotlightColor": "spotlight rengi hex kodu",
  "leftPanelColor": "sol panel rengi hex kodu",
  "rightPanelColor": "sağ panel rengi hex kodu",
  "gridColor": "karo çizgileri rengi hex kodu",
  "reflectionOpacity": 0.15,
  "spotlightWidth": 0.65,
  "showNeonStrips": true,
  "showSpotlight": true,
  "showFloorGrid": false,
  "bgStyle": "dealer",
  "lightPanelOpacity": 0.15,
  "name": "temaya uygun kısa renk adı",
  "studioDesc": "oluşturulan yeni stüdyo stilinin adı",
  "lighting": "ışık tasarım açıklaması",
  "carScale": 0.70,
  "shadowOpacity": 0.60,
  "shadowOffsetY": 0,
  "shadowScaleX": 1.0
}`

            const res = await fetch("/api/flow-ai", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                message: aiPrompt,
                history: [],
                apiKey: userApiKey || undefined,
                image: {
                  mimeType,
                  data: base64Data
                }
              })
            })

            const data = await res.json()
            if (res.ok && data.reply) {
              let replyText = data.reply.trim()
              if (replyText.startsWith("```json")) replyText = replyText.substring(7)
              if (replyText.startsWith("```")) replyText = replyText.substring(3)
              if (replyText.endsWith("```")) replyText = replyText.substring(0, replyText.length - 3)
              replyText = replyText.trim()

              const parsed = JSON.parse(replyText)
              if (parsed.bg && parsed.accent && parsed.studioDesc) {
                finalConfig = {
                  ...defaultConfig,
                  bg: parsed.bg,
                  floorColor: parsed.floorColor || parsed.bg,
                  accent: parsed.accent,
                  spotlightColor: parsed.spotlightColor || parsed.accent,
                  leftPanelColor: parsed.leftPanelColor || parsed.accent,
                  rightPanelColor: parsed.rightPanelColor || parsed.accent,
                  gridColor: parsed.gridColor || parsed.accent,
                  reflectionOpacity: typeof parsed.reflectionOpacity === "number" ? parsed.reflectionOpacity : 0.16,
                  spotlightWidth: typeof parsed.spotlightWidth === "number" ? parsed.spotlightWidth : 0.65,
                  showNeonStrips: parsed.showNeonStrips !== undefined ? parsed.showNeonStrips : false,
                  showSpotlight: parsed.showSpotlight !== undefined ? parsed.showSpotlight : false,
                  showFloorGrid: parsed.showFloorGrid !== undefined ? parsed.showFloorGrid : false,
                  bgStyle: parsed.bgStyle || "dealer",
                  censorPlate: defaultConfig.censorPlate,
                  lightPanelOpacity: typeof parsed.lightPanelOpacity === "number" ? parsed.lightPanelOpacity : 0.1,
                  name: parsed.name || "AI Özel",
                  studioDesc: parsed.studioDesc,
                  lighting: parsed.lighting || "AI Işık Tasarımı",
                  carScale: typeof parsed.carScale === "number" ? parsed.carScale : 0.70,
                  shadowOpacity: typeof parsed.shadowOpacity === "number" ? parsed.shadowOpacity : 0.60,
                  shadowOffsetY: typeof parsed.shadowOffsetY === "number" ? parsed.shadowOffsetY : 0,
                  shadowScaleX: typeof parsed.shadowScaleX === "number" ? parsed.shadowScaleX : 1.0
                }
                setShowroomConfig(finalConfig)
              }
            }
          } catch (aiErr) {
            console.warn("AI showroom config failed, using fallback:", aiErr)
          }
        }

        setProcessingStep(90)
        setProcessingLabel("Profesyonel stüdyo birleştiriliyor...")

        const compositeBase64 = await createStudioComposite(transparentCarUrl, {
          ...finalConfig,
          censorPlate: false
        })
        setEnhancedImage(compositeBase64)
        
        setProcessingStep(100)
        setProcessingLabel("Hazır!")
        setProcessing(false)
        setEnhanceSuccess(true)
        setRevisionMode(true)

        setMesajlar(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            sender: "ai",
            text: `✅ Araç stüdyoya başarıyla yerleştirildi!\n\n• Stil: **${finalConfig.studioDesc}**\n• Işık Konsepti: *${finalConfig.lighting}*\n\nGörseli aşağıdaki butonla indirebilir veya değiştirmek istediğiniz detayları bana yazabilirsiniz!`,
            imagePreview: compositeBase64,
            timestamp: now()
          }
        ])

      } catch (err: any) {
        console.error("Enhance error:", err)
        setProcessing(false)
        addAiMsg(`⚠️ Görsel işlenirken bir hata oluştu: ${err.message || err}`)
      }
    }
    img.src = imageUrl
  }

  /* ── Ön Analiz & Renk Hazırlığı ── */
  const extractColorsAndPrep = (imageUrl: string) => {
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
      
      const defaultConfig = makeDefaultConfig(profile, dealerName, dealerLogoUrl || undefined)
      setShowroomConfig(defaultConfig)
      
      try {
        const downsized = canvas.toDataURL("image/png")
        setDownsizedImageBase64(downsized)
      } catch (err) {
        console.warn("Could not capture downsized base64:", err)
      }
      setColorAnalyzing(false)
    }
    img.src = imageUrl
  }

  /* ── Dosya Yükleme Hooku ── */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const src = reader.result as string
      setUploadedImage(src)
      setEnhanceSuccess(false)
      setEnhancedImage(null)
      setDetectedColor(null)
      setShowroomConfig(null)
      setDownsizedImageBase64(null)
      setColorSwatchVisible(false)
      setRevisionMode(false)
      if (transparentCarUrlState) {
        URL.revokeObjectURL(transparentCarUrlState)
        setTransparentCarUrlState(null)
      }
      
      const userMsg: Mesaj = {
        id: Date.now() + Math.random(),
        sender: "user",
        text: `📸 "${file.name}" yüklendi. Stüdyo sentezi başlatılıyor...`,
        imagePreview: src,
        timestamp: now()
      }
      setMesajlar(prev => [...prev, userMsg])
      
      setTimeout(() => {
        analyzeAndEnhanceImage(src)
      }, 200)
    }
    reader.readAsDataURL(file)
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
                           text.includes("plaka") || text.includes("sansür") || text.includes("gizle") ||
                           text.includes("yok et") || text.includes("karanlık") || text.includes("aydınlık") ||
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
- Arka plan stili (bgStyle): "${showroomConfig.bgStyle}" ("classic", "garage", "sunset", "minimalist", "scifi", "dealer")
- Plakayı sansürleme (censorPlate): ${showroomConfig.censorPlate} (true/false)
- Işık panel yansımalarının görünürlüğü (lightPanelOpacity): ${showroomConfig.lightPanelOpacity} (0.0 ile 0.5 arası)
- Arabayı geriye alma/küçültme ölçeği (carScale): ${showroomConfig.carScale || 0.70} (0.4 ile 0.9 arası)

Kullanıcının yeni talebi: "${prompt}"

Görevin: Kullanıcının talebini en hassas şekilde analiz et ve stüdyonun tüm parametrelerini buna göre güncelle. 

Tasarım Kılavuzu:
1. Kullanıcı "yansımaları kaldır", "yansımaları sil" veya "yansıma istemiyorum" derse: "reflectionOpacity" değerini 0.0 ve "lightPanelOpacity" değerini 0.0 yap.
2. Kullanıcı "daha parlak yansıma/ayna zemin yap" derse: "reflectionOpacity" değerini 0.45 ve "lightPanelOpacity" değerini 0.22 yap.
3. Kullanıcı "ışıkları kapat/loş yap/karanlık yap" derse: "showSpotlight" = false, "showNeonStrips" = false, "lightPanelOpacity" = 0.0, "bg" = "#030303", "floorColor" = "#010101".
4. Kullanıcı "tepe ışığını daralt/küçült" derse: "spotlightWidth" = 0.25. "genişlet/büyüt" derse: "spotlightWidth" = 1.25.
5. Kullanıcı "plakayı kapat/sansürle/yok et/gizle" derse: "censorPlate" = true.
6. Kullanıcı "plakayı aç/sansürsüz yap" derse: "censorPlate" = false.
7. Kullanıcı "sunset/gün batımı stüdyosu olsun" derse: "bgStyle" = "sunset", "bg" = "#a62429", "floorColor" = "#1a0803", "accent" = "#d98b1e".
8. Kullanıcı "siberpunk/scifi stüdyosu olsun" derse: "bgStyle" = "scifi", "accent" = "#ff0077".
9. Kullanıcı "minimalist stüdyo olsun" derse: "bgStyle" = "minimalist", "showNeonStrips" = false, "showFloorGrid" = false.
10. Kullanıcı "beton garaj olsun" derse: "bgStyle" = "garage", "bg" = "#1a1a1c", "floorColor" = "#0f0f10".
11. Kullanıcı "arabayı geriye al", "fotoğrafı geriye al", "arabayı küçült", "uzaklaştır" veya "daha uzaktan çekilmiş gibi yap" derse: "carScale" değerini 0.60 veya 0.55 yap.
12. Kullanıcı "arabayı yakınlaştır", "arabayı büyüt" derse: "carScale" değerini 0.82 yap.
13. Kullanıcı "dealer/bayi stüdyosu olsun", "varsayılan yap" derse: "bgStyle" = "dealer".

Yanıtında JSON dışında hiçbir açıklama, kod blok işaretçisi (\`\`\`json vb.) veya ek yazı BULUNMAMALIDIR. Sadece saf JSON string dön. Eğer kullanıcı bazı özellikleri değiştirmek istemediyse mevcut değerlerini aynen koru.

JSON Formatı:
{
  "bg": "duvar için hex rengi (örn: #050a1a, #0a0a0a)",
  "floorColor": "zemin için hex rengi",
  "accent": "neon şeritler için hex rengi",
  "spotlightColor": "spotlight için hex rengi",
  "leftPanelColor": "sol panel için hex rengi",
  "rightPanelColor": "sağ panel için hex rengi",
  "gridColor": "karo çizgileri için hex rengi",
  "reflectionOpacity": 0.16,
  "spotlightWidth": 0.65,
  "showNeonStrips": false,
  "showSpotlight": false,
  "showFloorGrid": false,
  "bgStyle": "dealer",
  "censorPlate": false,
  "lightPanelOpacity": 0.1,
  "name": "temaya uygun kısa renk adı",
  "studioDesc": "oluşturulan yeni stüdyo stilinin adı",
  "lighting": "ışık tasarımının kısa açıklaması",
  "carScale": 0.70
}`

    try {
      const res = await fetch("/api/flow-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: systemPrompt,
          history: [],
          apiKey: userApiKey || undefined,
          image: downsizedImageBase64 ? {
            mimeType: downsizedImageBase64.split(";")[0].split(":")[1],
            data: downsizedImageBase64.split(",")[1]
          } : undefined
        })
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
        reflectionOpacity: typeof parsed.reflectionOpacity === "number" ? parsed.reflectionOpacity : 0.16,
        spotlightWidth: typeof parsed.spotlightWidth === "number" ? parsed.spotlightWidth : 0.65,
        showNeonStrips: parsed.showNeonStrips !== undefined ? parsed.showNeonStrips : false,
        showSpotlight: parsed.showSpotlight !== undefined ? parsed.showSpotlight : false,
        showFloorGrid: parsed.showFloorGrid !== undefined ? parsed.showFloorGrid : false,
        bgStyle: parsed.bgStyle || "dealer",
        censorPlate: parsed.censorPlate !== undefined ? parsed.censorPlate : (showroomConfig?.censorPlate || false),
        lightPanelOpacity: typeof parsed.lightPanelOpacity === "number" ? parsed.lightPanelOpacity : 0.1,
        name: parsed.name || "Özel Revizyon",
        studioDesc: parsed.studioDesc,
        lighting: parsed.lighting || "Özelleştirilmiş showroom aydınlatması",
        dealerName: showroomConfig?.dealerName,
        dealerLogoUrl: showroomConfig?.dealerLogoUrl,
        carScale: typeof parsed.carScale === "number" ? parsed.carScale : (showroomConfig?.carScale || 0.70),
        shadowOpacity: typeof parsed.shadowOpacity === "number" ? parsed.shadowOpacity : (showroomConfig?.shadowOpacity || 0.60),
        shadowOffsetY: typeof parsed.shadowOffsetY === "number" ? parsed.shadowOffsetY : (showroomConfig?.shadowOffsetY || 0),
        shadowScaleX: typeof parsed.shadowScaleX === "number" ? parsed.shadowScaleX : (showroomConfig?.shadowScaleX || 1.0)
      }

      setProcessingStep(85)
      const compositeBase64 = await createStudioComposite(transparentCarUrlState, {
        ...revisedConfig,
        censorPlate: false
      })
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
        { id: Date.now() + Math.random(), sender: "user", text: prompt, timestamp: now() },
        {
          id: Date.now() + Math.random(),
          sender: "ai",
          text: `🎨 İstediğiniz değişiklikleri uyguladım!\n\n• Stil: **${revisedConfig.studioDesc}**\n• Açıklama: *${revisedConfig.lighting}*\n\nGörseli aşağıdaki butonla indirebilir veya yeni değişiklikler yazabilirsiniz!`,
          imagePreview: compositeBase64,
          timestamp: now()
        }
      ])
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

    // 1. Orijinal fotoğraf yüklenmiş ama stüdyo henüz oluşturulmamışsa (ilk istek)
    if (uploadedImage && !enhanceSuccess) {
      const userMsg: Mesaj = { id: Date.now() + Math.random(), sender: "user", text, timestamp: now() }
      setMesajlar(prev => [...prev, userMsg])
      setInputText("")
      await analyzeAndEnhanceImage(uploadedImage, text)
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

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div className="flex flex-col min-h-screen bg-af-bg text-af-text">
      {/* Hidden canvas for stüdyo rendering */}
      <canvas ref={canvasRef} className="hidden" />

      <PanelTopbar
        baslik="Flow AI Akıllı Stüdyo"
        aciklama="Araç fotoğraflarınızı yapay zeka yardımıyla sohbet ederek stüdyo ortamına yerleştirin"
      />

      <main className="flex-1 p-4 lg:p-6 max-w-4xl w-full mx-auto pb-12 relative flex flex-col items-center">

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

        {/* ════ CHAT WINDOW ════ */}
        <div className="w-full bg-af-surface border border-af-border rounded-3xl flex flex-col shadow-2xl overflow-hidden" style={{ height: "720px" }}>

          {/* Chat Header */}
          <div className="p-4 border-b border-af-border bg-af-surface-2/30 flex-shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-af-accent to-purple-600 flex items-center justify-center shadow-lg shadow-af-accent/25">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm">Flow AI Akıllı Stüdyo Asistanı</h3>
                <span className="text-[10px] text-af-success flex items-center gap-1.5">
                  {isTyping || processing
                    ? <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> İşleniyor...</>
                    : <><span className="w-1.5 h-1.5 rounded-full bg-af-success animate-pulse" /> Çevrimiçi · Gemini AI</>}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {uploadedImage && (
                <button
                  onClick={() => {
                    setUploadedImage(null)
                    setEnhancedImage(null)
                    setTransparentCarUrlState(null)
                    setEnhanceSuccess(false)
                    setRevisionMode(false)
                    setMesajlar([
                      {
                        id: 1,
                        sender: "ai",
                        text: `Merhaba! Yeni bir araç fotoğrafı yükleyerek başlayabilirsiniz. 📸`,
                        timestamp: now()
                      }
                    ])
                  }}
                  className="text-[10px] font-bold text-af-text-secondary hover:text-white bg-af-surface-2 border border-af-border hover:border-white/20 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Yeni Fotoğraf
                </button>
              )}

              <button
                onClick={() => setShowApiKeyInput(p => !p)}
                title="API Anahtarı Gir"
                className="w-8 h-8 rounded-xl bg-af-surface-2 border border-af-border text-af-text-disabled hover:text-af-accent hover:border-af-accent/30 flex items-center justify-center transition-colors text-xs"
              >
                🔑
              </button>
            </div>
          </div>

          {/* API Key input box */}
          {showApiKeyInput && (
            <div className="p-3 border-b border-af-border bg-af-surface-2/20 flex gap-2 animate-in slide-in-from-top-2 duration-300">
              <input
                type="password"
                placeholder="Gemini API Key (AIza...)"
                value={userApiKey}
                onChange={e => setUserApiKey(e.target.value)}
                className="flex-1 bg-af-surface border border-af-border text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-af-accent placeholder:text-af-text-disabled"
              />
              <button
                onClick={() => setShowApiKeyInput(false)}
                className="text-xs bg-af-accent text-white px-3 py-2 rounded-xl font-bold hover:bg-af-accent-hover transition-colors"
              >
                Kaydet
              </button>
            </div>
          )}

          {/* Mesaj Listesi */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* Upload Zone (No image yet) */}
            {!uploadedImage && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-af-border/60 hover:border-af-accent/40 rounded-3xl p-10 flex flex-col items-center text-center cursor-pointer hover:bg-af-surface-2/20 transition-all group my-6"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-af-accent/10 to-purple-600/10 border border-af-accent/20 group-hover:border-af-accent/40 text-af-accent flex items-center justify-center mb-4 transition-all group-hover:scale-105">
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="font-bold text-white text-sm mb-1.5">Araç Fotoğrafı Yükleyin</h4>
                <p className="text-xs text-af-text-disabled max-w-sm leading-relaxed">
                  Arka planı otomatik temizlenecek araba görselinizi buraya bırakın veya tıklayın.
                </p>
                <p className="text-[10px] text-af-text-disabled/60 mt-3">Desteklenen formatlar: PNG, JPG, WEBP</p>
              </div>
            )}

            {/* Mesaj Balonları */}
            {mesajlar.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col rounded-2xl p-3.5 text-xs leading-relaxed max-w-[85%] shadow-sm",
                  m.sender === "ai"
                    ? m.isError
                      ? "bg-red-950/40 border border-red-500/20 mr-auto rounded-tl-sm text-af-text"
                      : "bg-af-surface-2 border border-af-border mr-auto rounded-tl-sm text-af-text"
                    : "bg-af-accent ml-auto text-white rounded-tr-sm"
                )}
              >
                {/* Image display inside bubble */}
                {m.imagePreview && (
                  <div className="w-full max-w-md rounded-xl overflow-hidden mb-2.5 relative border border-white/5 shadow-lg group">
                    <img src={m.imagePreview} alt="" className="w-full h-auto object-contain bg-black/20" />
                    {m.sender === "ai" && !m.isTyping && (
                      <button
                        onClick={() => {
                          const a = document.createElement("a")
                          a.href = m.imagePreview!
                          a.download = `flow-ai-studyo-${m.id}.png`
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                        }}
                        className="absolute bottom-2.5 right-2.5 bg-af-accent hover:bg-af-accent-hover text-white text-[10px] font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" /> İndir
                      </button>
                    )}
                  </div>
                )}

                {m.isTyping ? (
                  <span className="flex items-center gap-1 h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-af-accent animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-af-accent animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-af-accent animate-bounce" style={{ animationDelay: "300ms" }} />
                  </span>
                ) : (
                  <p className="whitespace-pre-line leading-relaxed">{m.text}</p>
                )}
                
                {!m.isTyping && (
                  <span className={cn("text-[9px] text-right mt-1.5 block", m.sender === "ai" ? (m.isError ? "text-red-400/60" : "text-af-text-disabled") : "text-white/60")}>
                    {m.timestamp}
                  </span>
                )}
              </div>
            ))}

            {/* AI İşleme Göstergesi */}
            {processing && (
              <div className="bg-af-surface-2 border border-af-border mr-auto rounded-2xl rounded-tl-sm p-4 w-full max-w-sm space-y-3 animate-pulse">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-af-accent to-purple-600 flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white text-xs">Flow AI Stüdyo İşleniyor</h5>
                    <p className="text-[10px] text-af-text-disabled">Aşama: {processingStep}%</p>
                  </div>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-af-accent transition-all duration-300"
                    style={{ width: `${processingStep}%` }}
                  />
                </div>
                <p className="text-[10px] text-af-accent font-medium leading-none">{processingLabel}</p>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick Suggestions / Revizyon Şablonları */}
          {enhanceSuccess && (
            <div className="px-4 py-2 bg-af-surface border-t border-af-border flex gap-1.5 overflow-x-auto flex-shrink-0 scrollbar-none">
              {[
                "Işıkları neon mavi yap",
                "Arka planı koyu stüdyo yap",
                "Neon şeritleri kapat",
                "Sarı aydınlatma ekle",
                "Spotlight ışığını kapat"
              ].map(q => (
                <button
                  key={q}
                  disabled={isTyping || processing}
                  onClick={() => sendMessage(q)}
                  className="text-[10px] font-semibold bg-af-surface-2 hover:bg-af-border disabled:opacity-40 text-af-text-secondary hover:text-white px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors border border-af-border flex-shrink-0"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Form / Chat Input */}
          <form id="flow-ai-form" onSubmit={handleSend} className="p-4 border-t border-af-border bg-af-surface-2/10 flex gap-2.5 flex-shrink-0">
            <input
              ref={chatInputRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              disabled={isTyping || processing || !uploadedImage}
              placeholder={
                !uploadedImage 
                  ? "Başlamak için önce fotoğraf yükleyin..." 
                  : isTyping || processing
                    ? "İşlem sürüyor, lütfen bekleyin..."
                    : "Görsel üzerinde değiştirmek istediğiniz detayları yazın (Örn: 'ışıkları yeşil yap')..."
              }
              className="flex-1 bg-af-surface-2 border border-af-border text-af-text placeholder:text-af-text-disabled rounded-2xl px-4 py-3 text-xs focus:outline-none focus:border-af-accent transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isTyping || processing || !inputText.trim() || !uploadedImage}
              className="w-10 h-10 rounded-2xl bg-af-accent hover:bg-af-accent-hover disabled:opacity-30 text-white flex items-center justify-center flex-shrink-0 transition-colors"
            >
              {isTyping || processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>

      </main>
    </div>
  )
}
