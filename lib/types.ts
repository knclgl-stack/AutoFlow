export type AracDurum = 'Aktif' | 'Satildi' | 'Pasif'
export type VitesTipi = 'Manuel' | 'Otomatik' | 'Yarı-Otomatik'
export type YakitTipi = 'Benzin' | 'Dizel' | 'Elektrik' | 'Hybrid' | 'LPG'
export type KasaTipi =
  | 'Sedan'
  | 'Hatchback'
  | 'SUV'
  | 'Coupe'
  | 'Pickup'
  | 'Cabrio'
  | 'Station Wagon'
  | 'Minivan'
export type AbonelikPlani = 'Essential' | 'Professional' | 'Elite'

export interface Galeri {
  id: string
  slug: string
  ad: string
  logo_url?: string
  adres: string
  sehir: string
  telefon: string
  whatsapp: string
  instagram?: string
  website?: string
  calisma_saatleri: {
    hafta_ici: string
    hafta_sonu: string
  }
  plan: AbonelikPlani
  created_at: string
}

export interface Arac {
  id: string
  galeri_id: string
  qr_slug: string

  // Temel Bilgiler
  marka: string
  model: string
  yil: number
  versiyon: string
  renk: string

  // Teknik Bilgiler
  motor_hacmi?: number   // cc
  motor_gucu?: number    // HP
  vites: VitesTipi
  yakit: YakitTipi
  kasa_tipi: KasaTipi
  km: number
  hasar_kaydi: boolean
  boyali_parca: number

  // Donanım Listesi
  ozellikler: string[]

  // Medya
  fotograflar: string[]
  video_url?: string

  // Fiyat
  fiyat?: number
  fiyat_gizle: boolean
  pazarlik_var: boolean

  // Durum
  durum: AracDurum

  // Meta
  created_at: string
  updated_at: string
}

export interface QrEvent {
  id: string
  arac_id: string
  timestamp: string
  device_type: 'mobile' | 'tablet' | 'desktop'
  sehir?: string
  whatsapp_tiklamasi: boolean
}

export interface DashboardStats {
  toplam_arac: number
  aktif_arac: number
  satilan_arac: number
  bu_hafta_qr: number
  toplam_qr: number
  bu_hafta_whatsapp: number
}
