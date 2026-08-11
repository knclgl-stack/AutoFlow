import { createHash } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

export const runtime = "nodejs"

const AdvisorRequestSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z.array(z.object({
    sender: z.enum(["user", "ai"]),
    text: z.string().max(2000),
  })).max(12).default([]),
  aracId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0)
    if (contentLength > 64_000) {
      return NextResponse.json({ error: "İstek boyutu çok büyük." }, { status: 413 })
    }

    const parsed = AdvisorRequestSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz danışman isteği." }, { status: 400 })
    }

    const { message, history, aracId } = parsed.data

    const key = process.env.GEMINI_API_KEY

    if (!key) {
      return NextResponse.json({
        error: "AI danışman servisi henüz yapılandırılmamış."
      }, { status: 503 })
    }

    const admin = createAdminClient()
    const [{ data: arac, error: vehicleError }, { data: quota, error: quotaError }] = await Promise.all([
      admin.from("araclar_public").select("*").eq("id", aracId).maybeSingle(),
      admin.rpc("consume_public_ai_quota", {
        p_arac_id: aracId,
        p_istemci_hash: getClientHash(req),
      }),
    ])

    if (vehicleError || !arac) {
      return NextResponse.json({ error: "Araç bulunamadı." }, { status: 404 })
    }
    if (quotaError) {
      console.error("Advisor quota error:", quotaError.message)
      return NextResponse.json({ error: "AI kotası kontrol edilemedi." }, { status: 503 })
    }
    if (!quota?.allowed) {
      const errors: Record<string, string> = {
        plan: "Bu galerinin planında AI araç danışmanı bulunmuyor.",
        daily: "Bugünkü danışman kullanım sınırınıza ulaştınız.",
        monthly: "Bu galerinin aylık AI danışman kotası doldu.",
        vehicle: "Araç bulunamadı.",
      }
      return NextResponse.json(
        { error: errors[quota?.reason] || "AI danışman şu anda kullanılamıyor." },
        { status: quota?.reason === "plan" ? 403 : 429 }
      )
    }

    const { data: galeri, error: galleryError } = await admin
      .from("galeri_profilleri_public")
      .select("*")
      .eq("user_id", arac.user_id)
      .maybeSingle()

    if (galleryError || !galeri) {
      return NextResponse.json({ error: "Galeri bulunamadı." }, { status: 404 })
    }

    // Tramer ve Boya Detaylarını Formatla
    const tramerDurumu = arac.tramer_kaydi
      ? `Var (${(arac.tramer_detay || []).length} kayıt mevcut. Detaylar: ${JSON.stringify(arac.tramer_detay)})`
      : "Yok (Hasar kaydı bulunmamaktadır)"
    
    const boyaDurumu = (arac.boyali_parcalar || []).length > 0
      ? `Boyalı/Değişen Parçalar: ${(arac.boyali_parcalar || []).join(", ")} (${arac.boyali_parca || 0} parça)`
      : "Boyalı veya değişen parçası yoktur (Tamamen Orijinal)"

    const agirHasar = arac.agir_hasar_kaydi ? "Ağır Hasarlı ⚠️ (Lütfen dürüstçe bilgi veriniz)" : "Ağır hasar kaydı yoktur ✅"

    const SYSTEM_PROMPT = `Sen "${galeri.galeri_adi || galeri.ad || 'AutoFlow'}" galerisinde çalışan profesyonel, samimi, güvenilir ve ikna edici bir yapay zeka satış danışmanısın. Adın "Flow AI".
Görevin, incelemekte olduğumuz aracı müşteriye pazarlamak, araba hakkındaki teknik/durum sorularını yanıtlamak ve müşteriyi galerimizle iletişime geçmeye (WhatsApp veya Telefon araması) yönlendirmektir.

Şu anda pazarladığın araç ve satıcı galerinin detayları aşağıdadır:

=== ARAÇ BİLGİLERİ ===
- Marka / Model: ${arac.marka} ${arac.model} (${arac.yil} Model)
- Paket / Versiyon: ${arac.versiyon || '—'}
- Kilometre: ${arac.km?.toLocaleString('tr-TR')} km
- Fiyat: ${arac.fiyat_gizle ? 'Fiyat için bizimle iletişime geçiniz.' : (arac.fiyat ? `${arac.fiyat?.toLocaleString('tr-TR')} ₺` : 'Fiyat belirtilmemiş')}
- Pazarlık Payı: ${arac.pazarlik_var ? 'Pazarlık payı vardır, galerimizle görüşülebilir.' : 'Fiyat sondur.'}
- Vites Tipi: ${arac.vites}
- Yakıt Tipi: ${arac.yakit}
- Kasa Tipi: ${arac.kasa_tipi}
- Renk: ${arac.renk}
- Motor Hacmi: ${arac.motor_hacmi ? `${arac.motor_hacmi} cc` : 'Belirtilmemiş'}
- Motor Gücü: ${arac.motor_gucu ? `${arac.motor_gucu} HP` : 'Belirtilmemiş'}

=== EKSPERTİZ & HASAR DURUMU ===
- Tramer Hasar Kaydı: ${tramerDurumu}
- Kaporta Boya Durumu: ${boyaDurumu}
- Ağır Hasar Kaydı: ${agirHasar}

=== DONANIM VE ÖZELLİKLER ===
${(arac.ozellikler || []).length > 0 ? (arac.ozellikler || []).map((o: string) => `• ${o}`).join("\n") : "• Standart donanım"}

=== AÇIKLAMA ===
"${arac.aciklama || 'Belirtilmemiş'}"

=== GALERİ (SATICI) BİLGİLERİ ===
- Galeri Adı: ${galeri.galeri_adi || galeri.ad}
- Adres: ${galeri.adres || '—'}, ${galeri.sehir || '—'}
- Telefon: ${galeri.telefon || '—'}
- Çalışma Saatleri: Hafta içi ${galeri.calisma_saatleri?.hafta_ici || '09:00-19:00'}, Hafta sonu ${galeri.calisma_saatleri?.hafta_sonu || '10:00-18:00'}

=== GÖREV KURALLARI VE DİL UYGULAMASI ===
1. Samimi, heyecanlı, yardımsever ama aşırı laubali olmayan profesyonel bir esnaf/satış dili kullan. Türkçe yaz.
2. SADECE yukarıda verilen bilgilere sadık kal. Olmayan donanımları veya bilgileri uydurma (Örn: Araçta şerit takip yoksa var deme).
3. Tramer veya hasar durumu sorulduğunda dürüst ve net ol. Gizleme yapma. Aracın durumunu şeffafça açıklamak alıcıda güven uyandırır.
4. Müşteriyi aracı yakından görmeye, showrooma kahve içmeye davet et veya WhatsApp/Telefon butonlarını kullanarak doğrudan satış temsilcimize bağlanmasını tavsiye et.
5. Cevaplarını kısa, akıcı ve okunabilir tut. Çok uzun paragraflar yerine listeler ve emojileri ölçülü kullan.
6. Müşteriye "siz" diye hitap et.
7. Müşteri aracın genel kronik sorunları, kullanıcı yorumları, yakıt tüketimi, test sürüşü incelemeleri, modelin teknik kronik zaafları veya araç modelinin tarihçesi/karşılaştırmaları hakkında soru sorduğunda, entegre Google Arama (google_search) aracını kullanarak en doğru, güncel ve tarafsız bilgileri araştırıp profesyonelce yorumla.`

    // Gemini API Geçmiş Formatlama (roles: user, model)
    const rawHistory = (history || []).map((m: { sender: string; text: string }) => ({
      role: m.sender === "ai" ? "model" : "user",
      parts: [{ text: m.text }]
    }))

    // İlk user mesajına kadar olan model mesajlarını at
    let startIdx = 0
    while (startIdx < rawHistory.length && rawHistory[startIdx].role !== "user") {
      startIdx++
    }
    const formattedHistory = rawHistory.slice(startIdx)

    const contents = [
      ...formattedHistory,
      {
        role: "user",
        parts: [{ text: message }]
      }
    ]

    let replyText = ""
    let lastErrorMsg = ""
    
    // Sırasıyla modellere istek at
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-flash-latest", "gemini-2.0-flash"]

    for (const modelName of modelsToTry) {
      try {
        console.log(`Direct fetch attempt with search grounding for Gemini model: ${modelName}`)
        
        // 1. Google Arama Grounding ile dene
        let response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": key,
            },
            signal: AbortSignal.timeout(12000), // 12-second timeout to prevent hangs
            body: JSON.stringify({
              contents: contents,
              systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }]
              },
              tools: [
                {
                  google_search: {}
                }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4000,
              }
            })
          }
        )

        let responseData = await response.json()

        // API anahtarı veya kota aramayı desteklemiyorsa otomatik olarak arama filtresiz normal sürüme düşür (Fallback)
        if (!response.ok && (
          responseData.error?.message?.toLowerCase().includes("tool") || 
          responseData.error?.message?.toLowerCase().includes("grounding") || 
          responseData.error?.message?.toLowerCase().includes("quota") ||
          responseData.error?.code === 403
        )) {
          console.warn(`Gemini API search grounding failed, falling back to standard inference...`)
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": key,
              },
              signal: AbortSignal.timeout(10000),
              body: JSON.stringify({
                contents: contents,
                systemInstruction: {
                  parts: [{ text: SYSTEM_PROMPT }]
                },
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 4000,
                }
              })
            }
          )
          responseData = await response.json()
        }

        if (!response.ok) {
          throw new Error(responseData.error?.message || `HTTP error ${response.status}`)
        }

        const candidateText = responseData.candidates?.[0]?.content?.parts?.[0]?.text
        if (candidateText) {
          replyText = candidateText
          break
        } else {
          throw new Error("API response did not contain text candidates")
        }
      } catch (err: any) {
        console.warn(`Direct fetch model ${modelName} failed:`, err.message)
        lastErrorMsg = err.message || "Bilinmeyen hata"
      }
    }

    if (!replyText) {
      console.error("Advisor AI models exhausted:", lastErrorMsg)
      return NextResponse.json({ error: "Yapay zeka servisi şu anda yanıt vermiyor." }, { status: 502 })
    }

    return NextResponse.json({ reply: replyText, quota })
  } catch (err: any) {
    console.error("Danışman AI API error:", err)
    return NextResponse.json({ error: "AI danışman servisine şu anda bağlanılamadı." }, { status: 500 })
  }
}

function getClientHash(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  const clientAddress = forwardedFor || req.headers.get("x-real-ip") || "unknown"
  const userAgent = req.headers.get("user-agent") || "unknown"
  const salt = process.env.RATE_LIMIT_SALT || "autoflow-public-advisor"

  return createHash("sha256")
    .update(`${clientAddress}|${userAgent}|${salt}`)
    .digest("hex")
}
