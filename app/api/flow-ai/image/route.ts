import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60

const FlowAiImageRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(2_000),
  image: z.object({
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    data: z.string().min(1).max(4_000_000),
  }),
})

type GeminiImagePart = {
  text?: string
  inlineData?: { mimeType?: string; data?: string }
  inline_data?: { mime_type?: string; data?: string }
}

const IMAGE_MODELS = ["gemini-3.1-flash-image", "gemini-2.5-flash-image"]

function buildVehicleEditPrompt(userPrompt: string) {
  return `You are Flow AI, a professional automotive photo retoucher. Edit the supplied photo; do not recreate it as a different vehicle.

NON-NEGOTIABLE VEHICLE LOCK — this has higher priority than the user's request:
- Preserve the exact same vehicle identity, make, model, trim, body shape, proportions and camera angle.
- Preserve the exact paint color, wheels, tires, grille, headlights, mirrors, windows, badges, panel lines and visible accessories.
- Do not redesign, replace, deform, add or remove any part of the vehicle.
- Keep the vehicle fully in frame. Do not add people or another vehicle.
- Preserve the license plate unless the user explicitly asks to hide or blur it.

ALLOWED EDITS:
- Replace or clean the background according to the user's request.
- Improve exposure, white balance, realistic studio lighting, contact shadow and physically plausible reflections.
- Make the vehicle look naturally photographed inside the requested environment while keeping its identity unchanged.
- Match the new environment's perspective and light direction to the original camera view.
- Produce one clean, photorealistic, premium automotive sales photograph with no text, watermark, border or collage unless explicitly requested.

USER REQUEST:
${userPrompt}

Apply the requested scene, background, lighting and reflection changes. When the request is vague, use a modern premium indoor automotive showroom with soft neutral lighting. Return only the edited image.`
}

function getGeneratedImage(responseData: unknown) {
  const candidates = (responseData as {
    candidates?: Array<{ content?: { parts?: GeminiImagePart[] } }>
  })?.candidates

  for (const candidate of candidates || []) {
    for (const part of candidate.content?.parts || []) {
      const inlineData = part.inlineData
      if (inlineData?.data) {
        return {
          data: inlineData.data,
          mimeType: inlineData.mimeType || "image/png",
        }
      }

      const snakeCaseData = part.inline_data
      if (snakeCaseData?.data) {
        return {
          data: snakeCaseData.data,
          mimeType: snakeCaseData.mime_type || "image/png",
        }
      }
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0)
    if (contentLength > 5_000_000) {
      return NextResponse.json({ error: "Fotoğraf işleme için çok büyük." }, { status: 413 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 })
    }

    const parsed = FlowAiImageRequestSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Fotoğraf veya düzenleme talebi geçersiz." }, { status: 400 })
    }

    const key = process.env.GEMINI_API_KEY
    if (!key) {
      return NextResponse.json({ error: "Görsel AI servisi henüz yapılandırılmamış." }, { status: 503 })
    }

    const { data: quota, error: quotaError } = await supabase.rpc("consume_ai_quota")
    if (quotaError) {
      console.error("Flow AI image quota error:", quotaError.message)
      return NextResponse.json({ error: "AI kotası kontrol edilemedi." }, { status: 503 })
    }
    if (!quota?.allowed) {
      const error = quota?.reason === "plan"
        ? "Flow AI yalnızca Professional ve Elite planlarında kullanılabilir."
        : `Aylık Flow AI kotanız doldu (${quota?.used || 0}/${quota?.limit || 0}).`
      return NextResponse.json({ error, quota }, { status: quota?.reason === "plan" ? 403 : 429 })
    }

    const { prompt, image } = parsed.data
    const lockedEditPrompt = buildVehicleEditPrompt(prompt)
    let lastError = ""

    for (const modelName of IMAGE_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": key,
            },
            signal: AbortSignal.timeout(55_000),
            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: [
                  { text: lockedEditPrompt },
                  {
                    inline_data: {
                      mime_type: image.mimeType,
                      data: image.data,
                    },
                  },
                ],
              }],
              generationConfig: {
                responseModalities: ["IMAGE"],
              },
            }),
          }
        )

        const responseData = await response.json()
        if (!response.ok) {
          const message = responseData?.error?.message || `HTTP ${response.status}`
          throw new Error(message)
        }

        const generatedImage = getGeneratedImage(responseData)
        if (generatedImage) {
          return NextResponse.json({ image: generatedImage, quota })
        }

        throw new Error("Model görsel çıktısı döndürmedi.")
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Bilinmeyen görsel üretim hatası"
        console.warn(`Flow AI image model ${modelName} failed:`, lastError)
      }
    }

    console.error("Flow AI image models exhausted:", lastError)
    return NextResponse.json(
      { error: "Görsel şu anda üretilemedi. Lütfen birkaç dakika sonra tekrar deneyin." },
      { status: 502 }
    )
  } catch (error) {
    console.error("Flow AI image route error:", error)
    return NextResponse.json(
      { error: "Görsel AI servisine şu anda bağlanılamadı." },
      { status: 500 }
    )
  }
}
