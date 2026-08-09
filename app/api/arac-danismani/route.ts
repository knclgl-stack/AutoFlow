import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { message, history, arac, galeri } = await req.json()

    const key = process.env.GEMINI_API_KEY

    if (!key) {
      return NextResponse.json({
        error: "Sistemde Gemini API anahtarı bulunamadı. Lütfen .env.local dosyasında GEMINI_API_KEY tanımlayın."
      }, { status: 500 })
    }

    if (!arac || !galeri) {
      return NextResponse.json({
        error: "Eksik araç veya galeri verisi."
      }, { status: 400 })
    }

    // Tramer ve Boya Detaylarını Formatla
    const tramerDurumu = arac.tramer_kaydi
      ? `Var (${(arac.tramer_detay || []).length} kayıt mevcut. Detaylar: ${JSON.stringify(arac.tramer_detay)})`
      : "Yok (Hasar kaydı bulunmamaktadır)"
    
    const boyaDurumu = (arac.boyali_parcalar || []).length > 0
      ? `Boyalı/Değişen Parçalar: ${(arac.boyali_parcalar || []).join(", ")} (${arac.boyali_parce || arac.boyali_parca || 0} parça)`
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
6. Müşteriye "siz" diye hitap et.`

    // Gemini API Geçmiş Formatlama (roles: user, model)
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

    const contents = [
      ...formattedHistory,
      {
        role: "user",
        parts: [{ text: message }]
      }
    ]

    const genAI = new GoogleGenerativeAI(key)
    let replyText = ""
    let lastErrorMsg = ""
    
    // Sırasıyla modellere istek at
    const modelsToTry = ["gemini-2.0-flash", "gemini-flash-latest"]

    for (const modelName of modelsToTry) {
      try {
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
        error: `Yapay zeka servisine bağlanılamadı: ${lastErrorMsg}` 
      }, { status: 500 })
    }

    return NextResponse.json({ reply: replyText })
  } catch (err: any) {
    console.error("Danışman AI API error:", err)
    return NextResponse.json({ error: `Sunucu hatası: ${err?.message || "Bilinmeyen hata"}` }, { status: 500 })
  }
}
