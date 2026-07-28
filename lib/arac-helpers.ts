import { Arac, AracDurum, YakitTipi } from './types'

export function formatFiyat(fiyat: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(fiyat)
}

export function formatKm(km: number): string {
  return new Intl.NumberFormat('tr-TR').format(km) + ' km'
}

export function getAracBaslik(arac: Arac): string {
  return `${arac.yil} ${arac.marka} ${arac.model}`
}

export function getAracTamBaslik(arac: Arac): string {
  return `${arac.yil} ${arac.marka} ${arac.model} ${arac.versiyon}`
}

export function getWhatsAppUrl(
  whatsapp: string | null | undefined,
  arac: Arac,
  baseUrl = 'https://autoflow.com.tr'
): string {
  const mesaj = encodeURIComponent(
    `Merhaba! *${arac.yil} ${arac.marka} ${arac.model} ${arac.versiyon}* hakkında bilgi almak istiyorum.\n\n🔗 ${baseUrl}/arac/${arac.qr_slug}`
  )
  const temizNumara = (whatsapp || '').replace(/\D/g, '')
  if (!temizNumara) return ''
  return `https://wa.me/${temizNumara}?text=${mesaj}`
}

export function getDurumConfig(durum: AracDurum) {
  switch (durum) {
    case 'Aktif':
      return {
        label: 'Satışta',
        bg: 'bg-[#22C55E]/15',
        text: 'text-[#22C55E]',
        border: 'border-[#22C55E]/30',
        dot: 'bg-[#22C55E]',
      }
    case 'Satildi':
      return {
        label: 'Satıldı',
        bg: 'bg-[#EF4444]/15',
        text: 'text-[#EF4444]',
        border: 'border-[#EF4444]/30',
        dot: 'bg-[#EF4444]',
      }
    case 'Pasif':
      return {
        label: 'Pasif',
        bg: 'bg-[#8A8A8A]/15',
        text: 'text-[#8A8A8A]',
        border: 'border-[#8A8A8A]/30',
        dot: 'bg-[#8A8A8A]',
      }
  }
}

export function getYakitIcon(yakit: YakitTipi): string {
  switch (yakit) {
    case 'Benzin':   return '⛽'
    case 'Dizel':    return '🛢️'
    case 'Elektrik': return '⚡'
    case 'Hybrid':   return '🔋'
    case 'LPG':      return '🟢'
  }
}

export function getAracQrUrl(aracSlug: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/arac/${aracSlug}`
  }
  return `http://localhost:3000/arac/${aracSlug}`
}

/** QR görüntü URL'i (api.qrserver.com) */
export function getQrImageUrl(data: string, size = 250): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&qzone=1&color=0-0-0&bgcolor=255-255-255`
}

/** Araç donanım ikonu */
export function getOzellikIcon(ozellik: string): string {
  const map: Record<string, string> = {
    'Isıtmalı': '🌡️',
    'Sunroof': '☀️',
    'Panoramik': '☀️',
    'Navigasyon': '🗺️',
    'Kamera': '📷',
    'Ses Sistemi': '🎵',
    'Şarj': '⚡',
    'Deri': '🪑',
    'LED': '💡',
    'Park': '🅿️',
    'CarPlay': '📱',
    'Hybrid': '🔋',
    'quattro': '🚙',
    '4x4': '🚙',
    'Keyless': '🔑',
    'Head-Up': '📊',
  }

  for (const [key, icon] of Object.entries(map)) {
    if (ozellik.toLowerCase().includes(key.toLowerCase())) return icon
  }
  return '✓'
}
