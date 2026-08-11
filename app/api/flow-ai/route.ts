import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const FlowAiRequestSchema = z.object({
  message: z.string().trim().min(1).max(8000),
  history: z.array(z.object({
    role: z.enum(["user", "ai"]),
    text: z.string().max(8000),
  })).max(20).default([]),
  image: z.object({
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    data: z.string().min(1).max(4_000_000),
  }).optional(),
})

const SYSTEM_PROMPT = `Sen "Flow AI" adlı bir yapay zeka asistanısın. AutoFlow platformunun bir parçasısın — Türk galericilerin araç yönetimi, ilan oluşturma ve fotoğraf stüdyosu hizmetleri sunan bir uygulamaya entegre edilmiş akıllı asistandır.

Temel Kimliğin:
- Adın: Flow AI
- Platform: AutoFlow (Türk araç galericileri için SaaS)
- Uzmanlıkların: Araç satışı, galeri yönetimi, araç fotoğrafçılığı, arka plan değiştirme, ilan optimizasyonu, araba fiyatlandırma

Görevlerin:
1. Her türlü soruya Türkçe, akıcı ve yardımsever bir şekilde cevap ver
2. Araç fotoğrafçılığı ve stüdyo arka plan değişimi konusunda uzman tavsiyeleri ver
3. Araç satışı, galeri yönetimi ve ilanlar hakkında bilgi paylaş
4. Kullanıcının yüklediği araç fotoğraflarını analiz etmeye ve iyileştirme önerileri sunmaya yardımcı ol
5. Genel konularda da (tarih, coğrafya, teknoloji, günlük hayat vb.) yardımcı ol — ama araç/galeri konularında ekstra uzmanlaşmış ol

Kişilik:
- Samimi, profesyonel ama arkadaşça
- Türkçe yazım kurallarına uy
- Emojileri ölçülü kullan
- Kısa ve öz cevap ver — gereksiz uzun paragraflar yazma
- Kullanıcıyı "siz" diye hitap et

AutoFlow Bilgileri:
- Flow AI Stüdyo: Araç fotoğraflarının arka planını AI ile değiştirme özelliği
- Desteklenen renkler ve stüdyolar: Siyah araçlar→siyah dramatik stüdyo, Beyaz/Gümüş→beyaz softbox stüdyo, Kırmızı/Turuncu→gün batımı sahil, Mavi/Lacivert→neon mavi stüdyo
- Fiyatlandırma: Essential (Flow AI yok), Professional (ayda 150 işlem), Elite (ayda 500 işlem)
- Galeri profili: Galeriler kendi sayfalarında araçlarını listeler, QR kod oluşturabilir, istatistik görür

Araç Fotoğrafçılığı Tavsiyelerimiz:
- En iyi açılar: ön-çapraz 3/4 oranı, tam yan profil, arka-çapraz
- Ideal ışık: bulutlu gün ya da altın saat (gün doğumu/batımı)
- Kaçınılacaklar: gölgeler, dağınık arka plan, aşırı güneş ışığı
- Net, iyi aydınlatılmış ve aracı doğru gösteren fotoğraflar kullanın`

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0)
    if (contentLength > 5_000_000) {
      return NextResponse.json({ error: "İstek boyutu çok büyük." }, { status: 413 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 })
    }

    const parsed = FlowAiRequestSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz veya fazla büyük AI isteği." }, { status: 400 })
    }

    const { message, history, image } = parsed.data

    const key = process.env.GEMINI_API_KEY
    if (!key) {
      return NextResponse.json({ error: "AI servisi henüz yapılandırılmamış." }, { status: 503 })
    }

    const { data: quota, error: quotaError } = await supabase.rpc("consume_ai_quota")
    if (quotaError) {
      console.error("Flow AI quota error:", quotaError.message)
      return NextResponse.json({ error: "AI kotası kontrol edilemedi." }, { status: 503 })
    }
    if (!quota?.allowed) {
      const error = quota?.reason === "plan"
        ? "Flow AI yalnızca Professional ve Elite planlarında kullanılabilir."
        : `Aylık Flow AI kotanız doldu (${quota?.used || 0}/${quota?.limit || 0}).`
      return NextResponse.json({ error, quota }, { status: quota?.reason === "plan" ? 403 : 429 })
    }

    // Gemini kuralı: history her zaman "user" ile başlamalı
    // Baştaki "model" mesajlarını kırp
    const rawHistory = (history || []).map((m: { role: string; text: string }) => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.text }]
    }))

    // İlk user mesajına kadar olan model mesajlarını at
    let startIdx = 0
    while (startIdx < rawHistory.length && rawHistory[startIdx].role !== "user") {
      startIdx++
    }
    const formattedHistory = rawHistory.slice(startIdx)

    let replyText = ""
    let lastErrorMsg = ""

    // Sırasıyla denenecek model isimleri
    const modelsToTry = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-flash-latest", "gemini-flash-lite-latest"]

    // Multimodal desteği: Eğer görsel gönderilmişse parts dizisine ekle
    const userParts: any[] = [{ text: message }]
    if (image && image.mimeType && image.data) {
      userParts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.data
        }
      })
    }

    // Sohbet geçmişini Gemini API formatına dönüştür (roles: user, model)
    const contents = [
      ...formattedHistory.map((h: any) => ({
        role: h.role,
        parts: h.parts
      })),
      {
        role: "user",
        parts: userParts
      }
    ]

    for (const modelName of modelsToTry) {
      try {
        console.log(`Direct fetch attempt for Gemini model: ${modelName}`)
        
        // Google Gemini REST API endpoint
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": key,
            },
            signal: AbortSignal.timeout(20000),
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

        const responseData = await response.json()

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
      console.error("Flow AI models exhausted:", lastErrorMsg)
      return NextResponse.json({ error: "Yapay zeka servisi şu anda yanıt vermiyor." }, { status: 502 })
    }

    return NextResponse.json({ reply: replyText, quota })
  } catch (err: any) {
    console.error("Flow AI API error:", err)
    const msg = err?.message || "Bilinmeyen hata"

    if (msg.includes("API_KEY_INVALID") || msg.includes("API key")) {
      return NextResponse.json({ error: "API anahtarı geçersiz. Lütfen Google AI Studio'dan yeni bir anahtar alın." }, { status: 401 })
    }

    return NextResponse.json({ error: "Yapay zeka servisine şu anda bağlanılamadı." }, { status: 500 })
  }
}
