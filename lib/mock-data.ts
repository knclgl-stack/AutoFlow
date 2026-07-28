import { Galeri, Arac, QrEvent, DashboardStats } from './types'

// ─── GALERİ ───────────────────────────────────────────────────────────────────

export const mockGaleri: Galeri = {
  id: 'galeri-001',
  slug: 'premium-motors',
  ad: 'Premium Motors İstanbul',
  adres: 'Atatürk Cad. No:42 Bağcılar',
  sehir: 'İstanbul',
  telefon: '+90 212 555 01 01',
  whatsapp: '+902125550101',
  instagram: 'premiummotors_ist',
  website: 'www.premiummotors.com.tr',
  calisma_saatleri: {
    hafta_ici: '09:00 - 19:00',
    hafta_sonu: '10:00 - 18:00',
  },
  plan: 'Elite',
  created_at: '2025-01-15T10:00:00Z',
}

// ─── ARAÇLAR ──────────────────────────────────────────────────────────────────

export const mockAraclar: Arac[] = [
  // 1 — BMW 3 Serisi (Aktif, premium)
  {
    id: 'af-001',
    galeri_id: 'galeri-001',
    qr_slug: 'af-001',
    marka: 'BMW',
    model: '3 Serisi',
    yil: 2023,
    versiyon: '320i M Sport',
    renk: 'Alpine Beyaz',
    motor_hacmi: 1998,
    motor_gucu: 184,
    vites: 'Otomatik',
    yakit: 'Benzin',
    kasa_tipi: 'Sedan',
    km: 12500,
    hasar_kaydi: false,
    boyali_parca: 0,
    ozellikler: [
      'Isıtmalı Ön Koltuklar',
      'Panoramik Sunroof',
      'Geri Görüş Kamerası',
      'Apple CarPlay / Android Auto',
      'Akıllı Navigasyon',
      'LED Far & Stop',
      'Şerit Takip Sistemi',
      'Park Sensörü (Ön & Arka)',
      'Hız Sabitleyici (Adaptif)',
      'Keyless Go',
      'Wireless Şarj',
      'Deri Döşeme',
    ],
    fotograflar: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&q=85&fit=crop',
      'https://images.unsplash.com/photo-1556189250-72ba954cfc2b?w=900&q=85&fit=crop',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=900&q=85&fit=crop',
    ],
    fiyat: 2850000,
    fiyat_gizle: false,
    pazarlik_var: true,
    durum: 'Aktif',
    created_at: '2025-06-01T09:00:00Z',
    updated_at: '2025-06-15T12:00:00Z',
  },

  // 2 — Mercedes C200 (Aktif)
  {
    id: 'af-002',
    galeri_id: 'galeri-001',
    qr_slug: 'af-002',
    marka: 'Mercedes-Benz',
    model: 'C Serisi',
    yil: 2022,
    versiyon: 'C 200 AMG Line',
    renk: 'Obsidyen Siyah',
    motor_hacmi: 1497,
    motor_gucu: 204,
    vites: 'Otomatik',
    yakit: 'Benzin',
    kasa_tipi: 'Sedan',
    km: 28000,
    hasar_kaydi: false,
    boyali_parca: 1,
    ozellikler: [
      'AMG Spor Paket',
      'Burmester Ses Sistemi',
      'Head-Up Display',
      'Isıtmalı & Ventilasyonlu Koltuklar',
      'Panoramik Tavan',
      '360° Kamera',
      'Aktif Şerit Asistanı',
      'MBUX Navigasyon',
      'Multibeam LED',
      'Keyless Start',
    ],
    fotograflar: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=900&q=85&fit=crop',
      'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=900&q=85&fit=crop',
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=900&q=85&fit=crop',
    ],
    fiyat: 2450000,
    fiyat_gizle: false,
    pazarlik_var: false,
    durum: 'Aktif',
    created_at: '2025-05-20T11:00:00Z',
    updated_at: '2025-06-10T09:30:00Z',
  },

  // 3 — Audi Q5 (Aktif, SUV)
  {
    id: 'af-003',
    galeri_id: 'galeri-001',
    qr_slug: 'af-003',
    marka: 'Audi',
    model: 'Q5',
    yil: 2023,
    versiyon: '40 TDI quattro S-Line',
    renk: 'Navarra Mavi',
    motor_hacmi: 1968,
    motor_gucu: 204,
    vites: 'Otomatik',
    yakit: 'Dizel',
    kasa_tipi: 'SUV',
    km: 9800,
    hasar_kaydi: false,
    boyali_parca: 0,
    ozellikler: [
      'S-Line Eksteriyor Paket',
      'quattro 4x4 Sistemi',
      'Matrix LED Farlar',
      'Virtual Cockpit Plus',
      'Audi Connect Navigasyon',
      'Isıtmalı Koltuklar',
      'Elektrikli Bagaj Kapağı',
      'B&O Ses Sistemi',
      'Sürüş Asistan Paketi',
      'Panoramik Tavan',
      'Deri Döşeme S',
    ],
    fotograflar: [
      'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=900&q=85&fit=crop',
      'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=900&q=85&fit=crop',
      'https://images.unsplash.com/photo-1562141961-22e9e06b5c96?w=900&q=85&fit=crop',
    ],
    fiyat: 3200000,
    fiyat_gizle: false,
    pazarlik_var: true,
    durum: 'Aktif',
    created_at: '2025-06-05T14:00:00Z',
    updated_at: '2025-06-20T16:00:00Z',
  },

  // 4 — Toyota Corolla (Aktif, ekonomik)
  {
    id: 'af-004',
    galeri_id: 'galeri-001',
    qr_slug: 'af-004',
    marka: 'Toyota',
    model: 'Corolla',
    yil: 2021,
    versiyon: '1.8 Hybrid Dream',
    renk: 'Kırmızı İnci',
    motor_hacmi: 1798,
    motor_gucu: 122,
    vites: 'Otomatik',
    yakit: 'Hybrid',
    kasa_tipi: 'Sedan',
    km: 54000,
    hasar_kaydi: false,
    boyali_parca: 2,
    ozellikler: [
      'Hybrid Sistemi',
      'Toyota Safety Sense',
      'Akıllı Park Asistanı',
      'Isıtmalı Ön Koltuklar',
      'JBL Ses Sistemi',
      'Kablosuz Apple CarPlay',
      'Arka Park Sensörü',
      'Konfor Paketi',
    ],
    fotograflar: [
      'https://images.unsplash.com/photo-1541443131876-44b03de101c5?w=900&q=85&fit=crop',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=900&q=85&fit=crop',
    ],
    fiyat: 950000,
    fiyat_gizle: false,
    pazarlik_var: true,
    durum: 'Aktif',
    created_at: '2025-04-10T10:00:00Z',
    updated_at: '2025-05-01T08:00:00Z',
  },

  // 5 — VW Golf (Satıldı)
  {
    id: 'af-005',
    galeri_id: 'galeri-001',
    qr_slug: 'af-005',
    marka: 'Volkswagen',
    model: 'Golf',
    yil: 2022,
    versiyon: '1.5 TSI Life',
    renk: 'Gümüş',
    motor_hacmi: 1498,
    motor_gucu: 150,
    vites: 'Otomatik',
    yakit: 'Benzin',
    kasa_tipi: 'Hatchback',
    km: 31500,
    hasar_kaydi: false,
    boyali_parca: 0,
    ozellikler: [
      'Dijital Kokpit',
      'LED Farlar',
      'Park Asistanı',
      'Isıtmalı Ön Koltuklar',
      'App-Connect (CarPlay/AA)',
    ],
    fotograflar: [
      'https://images.unsplash.com/photo-1471444928343-9b0a6bdb9bc6?w=900&q=85&fit=crop',
      'https://images.unsplash.com/photo-1548211088-32e7a1dc3f38?w=900&q=85&fit=crop',
    ],
    fiyat: 1150000,
    fiyat_gizle: false,
    pazarlik_var: false,
    durum: 'Satildi',
    created_at: '2025-03-01T09:00:00Z',
    updated_at: '2025-05-10T15:00:00Z',
  },

  // 6 — Renault Clio (Aktif, fiyat gizli)
  {
    id: 'af-006',
    galeri_id: 'galeri-001',
    qr_slug: 'af-006',
    marka: 'Renault',
    model: 'Clio',
    yil: 2024,
    versiyon: '1.0 TCe Icon',
    renk: 'Kardinalite Kırmızı',
    motor_hacmi: 999,
    motor_gucu: 90,
    vites: 'Manuel',
    yakit: 'Benzin',
    kasa_tipi: 'Hatchback',
    km: 3200,
    hasar_kaydi: false,
    boyali_parca: 0,
    ozellikler: [
      'Easy Link 9.3" Dokunmatik',
      'Geri Görüş Kamerası',
      'Hands-Free Park',
      'Isıtmalı Ön Cam',
      'Wireless CarPlay',
    ],
    fotograflar: [
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=900&q=85&fit=crop',
      'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=900&q=85&fit=crop',
    ],
    fiyat: 750000,
    fiyat_gizle: true,
    pazarlik_var: false,
    durum: 'Aktif',
    created_at: '2025-07-01T10:00:00Z',
    updated_at: '2025-07-01T10:00:00Z',
  },

  // 7 — Ford Mustang (Aktif, fiyat gizli)
  {
    id: 'af-007',
    galeri_id: 'galeri-001',
    qr_slug: 'af-007',
    marka: 'Ford',
    model: 'Mustang',
    yil: 2022,
    versiyon: '5.0 V8 GT Fastback',
    renk: 'Yarış Kırmızısı',
    motor_hacmi: 4951,
    motor_gucu: 450,
    vites: 'Manuel',
    yakit: 'Benzin',
    kasa_tipi: 'Coupe',
    km: 18700,
    hasar_kaydi: false,
    boyali_parca: 0,
    ozellikler: [
      'V8 5.0L Coyote Motor',
      'SYNC 4 Multimedya',
      'B&O Play Ses Sistemi',
      'Performans Paketi',
      'Brembo Fren Sistemi',
      'Akılı Park Yeri Tespiti',
      'Active Exhaust System',
      '19" Siyah Jant',
    ],
    fotograflar: [
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=900&q=85&fit=crop',
      'https://images.unsplash.com/photo-1584345604476-8ec5f82d718a?w=900&q=85&fit=crop',
    ],
    fiyat: 4200000,
    fiyat_gizle: true,
    pazarlik_var: false,
    durum: 'Aktif',
    created_at: '2025-06-15T13:00:00Z',
    updated_at: '2025-07-05T10:00:00Z',
  },
]

// ─── QR EVENTS (Analytics için mock) ─────────────────────────────────────────

const now = new Date()
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString()

export const mockQrEvents: QrEvent[] = [
  // Bugün
  { id: 'ev-001', arac_id: 'af-001', timestamp: daysAgo(0), device_type: 'mobile', sehir: 'İstanbul', whatsapp_tiklamasi: true },
  { id: 'ev-002', arac_id: 'af-001', timestamp: daysAgo(0), device_type: 'mobile', sehir: 'İstanbul', whatsapp_tiklamasi: false },
  { id: 'ev-003', arac_id: 'af-003', timestamp: daysAgo(0), device_type: 'mobile', sehir: 'Ankara', whatsapp_tiklamasi: true },
  { id: 'ev-004', arac_id: 'af-002', timestamp: daysAgo(0), device_type: 'tablet', sehir: 'İstanbul', whatsapp_tiklamasi: false },
  // Dün
  { id: 'ev-005', arac_id: 'af-001', timestamp: daysAgo(1), device_type: 'mobile', sehir: 'İzmir', whatsapp_tiklamasi: true },
  { id: 'ev-006', arac_id: 'af-002', timestamp: daysAgo(1), device_type: 'mobile', sehir: 'İstanbul', whatsapp_tiklamasi: false },
  { id: 'ev-007', arac_id: 'af-007', timestamp: daysAgo(1), device_type: 'mobile', sehir: 'İstanbul', whatsapp_tiklamasi: true },
  { id: 'ev-008', arac_id: 'af-004', timestamp: daysAgo(1), device_type: 'desktop', sehir: 'Bursa', whatsapp_tiklamasi: false },
  // 2 gün önce
  { id: 'ev-009', arac_id: 'af-003', timestamp: daysAgo(2), device_type: 'mobile', sehir: 'İstanbul', whatsapp_tiklamasi: true },
  { id: 'ev-010', arac_id: 'af-001', timestamp: daysAgo(2), device_type: 'mobile', sehir: 'Ankara', whatsapp_tiklamasi: false },
  { id: 'ev-011', arac_id: 'af-001', timestamp: daysAgo(2), device_type: 'mobile', sehir: 'İstanbul', whatsapp_tiklamasi: true },
  // 3-7 gün önce
  { id: 'ev-012', arac_id: 'af-002', timestamp: daysAgo(3), device_type: 'mobile', sehir: 'İstanbul', whatsapp_tiklamasi: false },
  { id: 'ev-013', arac_id: 'af-007', timestamp: daysAgo(3), device_type: 'mobile', sehir: 'İzmir', whatsapp_tiklamasi: true },
  { id: 'ev-014', arac_id: 'af-004', timestamp: daysAgo(4), device_type: 'tablet', sehir: 'İstanbul', whatsapp_tiklamasi: false },
  { id: 'ev-015', arac_id: 'af-003', timestamp: daysAgo(4), device_type: 'mobile', sehir: 'Ankara', whatsapp_tiklamasi: true },
  { id: 'ev-016', arac_id: 'af-001', timestamp: daysAgo(5), device_type: 'mobile', sehir: 'İstanbul', whatsapp_tiklamasi: false },
  { id: 'ev-017', arac_id: 'af-006', timestamp: daysAgo(5), device_type: 'mobile', sehir: 'İstanbul', whatsapp_tiklamasi: true },
  { id: 'ev-018', arac_id: 'af-002', timestamp: daysAgo(6), device_type: 'mobile', sehir: 'Bursa', whatsapp_tiklamasi: false },
  { id: 'ev-019', arac_id: 'af-007', timestamp: daysAgo(6), device_type: 'mobile', sehir: 'İstanbul', whatsapp_tiklamasi: true },
  { id: 'ev-020', arac_id: 'af-003', timestamp: daysAgo(7), device_type: 'desktop', sehir: 'Ankara', whatsapp_tiklamasi: false },
]

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────

export const mockDashboardStats: DashboardStats = {
  toplam_arac: mockAraclar.length,
  aktif_arac: mockAraclar.filter((a) => a.durum === 'Aktif').length,
  satilan_arac: mockAraclar.filter((a) => a.durum === 'Satildi').length,
  bu_hafta_qr: mockQrEvents.filter((e) => new Date(e.timestamp) > new Date(daysAgo(7))).length,
  toplam_qr: mockQrEvents.length,
  bu_hafta_whatsapp: mockQrEvents.filter(
    (e) => e.whatsapp_tiklamasi && new Date(e.timestamp) > new Date(daysAgo(7))
  ).length,
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function getAracById(id: string): Arac | undefined {
  return mockAraclar.find((a) => a.qr_slug === id || a.id === id)
}

export function getAraclarByGaleri(galeriId: string): Arac[] {
  return mockAraclar.filter((a) => a.galeri_id === galeriId)
}

export function getGaleriBySlug(slug: string): Galeri | undefined {
  // Mock data aşamasında tek galeri var; herhangi bir slug için demo galeriyi döndür
  if (slug) return mockGaleri
  return undefined
}
