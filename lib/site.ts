export const SITE_NAME = "AutoFlow"
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://auto-flow-mu.vercel.app"
).replace(/\/$/, "")

export const SITE_TITLE = "AutoFlow | Galeriler İçin QR Kodlu Dijital Araç Vitrini"
export const SITE_DESCRIPTION =
  "Araç galerinizi QR kodlarla dijitalleştirin. Müşteriler araç bilgilerine, fotoğraflara ve WhatsApp iletişimine uygulama indirmeden ulaşsın."

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString()
}

export function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value)
}
