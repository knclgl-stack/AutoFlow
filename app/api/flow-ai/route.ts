import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

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
- Fiyatlandırma: Essential (Kullanılamaz), Professional (aylık 3.000₺ sınırsız), Elite (aylık 5.000₺ öncelikli)
- Galeri profili: Galeriler kendi sayfalarında araçlarını listeler, QR kod oluşturabilir, istatistik görür

Araç Fotoğrafçılığı Tavsiyelerimiz:
- En iyi açılar: ön-çapraz 3/4 oranı, tam yan profil, arka-çapraz
- Ideal ışık: bulutlu gün ya da altın saat (gün doğumu/batımı)
- Kaçınılacaklar: gölgeler, dağınık arka plan, aşırı güneş ışığı
- Araç satışında profesyonel fotoğraf %35 daha fazla potansiyel alıcı çeker`

export async function POST(req: NextRequest) {
  try {
    const { message, history, apiKey } = await req.json()

    // API key: önce istek body'sinden, sonra .env'den
    const key = apiKey || process.env.GEMINI_API_KEY

    if (!key) {
      return NextResponse.json({
        error: "API anahtarı bulunamadı. Lütfen .env.local dosyasına GEMINI_API_KEY ekleyin ya da sohbet ekranındaki ayarlardan anahtarınızı girin."
      }, { status: 401 })
    }

    const genAI = new GoogleGenerativeAI(key)
    
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

    // Sohbet geçmişini Gemini API formatına dönüştür (roles: user, model)
    const contents = [
      ...formattedHistory.map((h: any) => ({
        role: h.role,
        parts: h.parts
      })),
      {
        role: "user",
        parts: [{ text: message }]
      }
    ]

    for (const modelName of modelsToTry) {
      try {
        console.log(`Direct fetch attempt for Gemini model: ${modelName}`)
        
        // Google Gemini REST API endpoint
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: contents,
              systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }]
              },
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 800,
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
      return NextResponse.json({ 
        error: `Yapay zeka servisine bağlanılamadı: ${lastErrorMsg}. Lütfen Google AI Studio'dan (aistudio.google.com) aldığınız API anahtarını kontrol edin ve projenizde Generative Language API'nin etkinleştirildiğinden emin olun.` 
      }, { status: 500 })
    }

    return NextResponse.json({ reply: replyText })
  } catch (err: any) {
    console.error("Flow AI API error:", err)
    const msg = err?.message || "Bilinmeyen hata"

    if (msg.includes("API_KEY_INVALID") || msg.includes("API key")) {
      return NextResponse.json({ error: "API anahtarı geçersiz. Lütfen Google AI Studio'dan yeni bir anahtar alın." }, { status: 401 })
    }

    return NextResponse.json({ error: `Yapay zeka servisine bağlanılamadı: ${msg}` }, { status: 500 })
  }
}
