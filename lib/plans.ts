import type { AbonelikPlani } from "@/lib/types"

export const PLAN_LIMITS: Record<AbonelikPlani, { vehicles: number | null; aiMonthly: number }> = {
  Essential: { vehicles: 3, aiMonthly: 0 },
  Professional: { vehicles: 12, aiMonthly: 150 },
  Elite: { vehicles: null, aiMonthly: 500 },
}

export function normalizePlan(plan?: string | null): AbonelikPlani {
  if (plan?.toLowerCase() === "professional") return "Professional"
  if (plan?.toLowerCase() === "elite") return "Elite"
  return "Essential"
}

export function getVehicleLimit(plan?: string | null): number | null {
  return PLAN_LIMITS[normalizePlan(plan)].vehicles
}

export function getAiMonthlyLimit(plan?: string | null): number {
  return PLAN_LIMITS[normalizePlan(plan)].aiMonthly
}
