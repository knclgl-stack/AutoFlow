export const ADMIN_EMAIL = "wwekaannet@gmail.com"

export function isAdmin(email?: string | null): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === ADMIN_EMAIL
}
