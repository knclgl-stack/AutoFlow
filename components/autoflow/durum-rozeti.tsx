"use client"

import { cn } from "@/lib/utils"
import { getDurumConfig } from "@/lib/arac-helpers"
import { AracDurum } from "@/lib/types"

interface DurumRozetiProps {
  durum: AracDurum
  size?: "sm" | "md" | "lg"
  className?: string
}

export function DurumRozeti({ durum, size = "md", className }: DurumRozetiProps) {
  const config = getDurumConfig(durum)

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium border",
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      <span className={cn("inline-block w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  )
}
