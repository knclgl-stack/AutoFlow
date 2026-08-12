export const SITE_NAME = "AutoFlow"
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://auto-flow-mu.vercel.app"
).replace(/\/$/, "")

export const SITE_TITLE = "AutoFlow | Galeriler İçin AI Destekli QR Araç Vitrini"
export const SITE_DESCRIPTION =
  "Araçlarınızı QR kodla yayınlayın; Flow AI ile fotoğrafları iyileştirin, araç sorularını yanıtlayın ve galerinizi 7/24 dijital vitrinde tutun."

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString()
}

export function isHttpUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value)
}
