export const ADMIN_EMAILS = [
  "admin@autoflow.com",
  "kaanclgl@gmail.com",
  "wwekaannet@gmail.com",
]

export function isAdmin(email?: string | null): boolean {
  if (!email) return false
  const lowerEmail = email.toLowerCase()
  return (
    ADMIN_EMAILS.includes(lowerEmail) ||
    lowerEmail.startsWith("admin@") ||
    lowerEmail === "admin"
  )
}
