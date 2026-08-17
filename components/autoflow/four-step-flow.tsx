import Link from "next/link"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export type FourStepStatus = "complete" | "current" | "upcoming"

export interface FourStepItem {
  title: string
  description: string
  status?: FourStepStatus
  href?: string
  actionLabel?: string
}

interface FourStepFlowProps {
  title: string
  description?: string
  steps: readonly [FourStepItem, FourStepItem, FourStepItem, FourStepItem]
  compact?: boolean
  className?: string
}

export function FourStepFlow({
  title,
  description,
  steps,
  compact = false,
  className,
}: FourStepFlowProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-2xl border border-af-border bg-af-surface",
        compact ? "p-3 sm:p-4" : "p-5 sm:p-6",
        className
      )}
    >
      <div className={cn("flex flex-col gap-1", compact ? "mb-3" : "mb-5")}>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-af-accent/25 bg-af-accent/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-af-accent">
            4 adım
          </span>
          <h2 className={cn("font-black text-white", compact ? "text-sm" : "text-lg")}>{title}</h2>
        </div>
        {description && <p className="text-xs leading-relaxed text-af-text-secondary">{description}</p>}
      </div>

      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => {
          const status = step.status || "upcoming"
          const body = (
            <div
              className={cn(
                "relative flex h-full items-start gap-3 rounded-xl border px-3.5 py-3 transition-all",
                status === "complete" && "border-af-success/25 bg-af-success/5",
                status === "current" && "border-af-accent/40 bg-af-accent/10 shadow-lg shadow-af-accent/5",
                status === "upcoming" && "border-af-border bg-af-surface-2/40",
                step.href && "hover:border-af-accent/40 hover:bg-af-surface-2"
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-black",
                  status === "complete" && "bg-af-success text-white",
                  status === "current" && "bg-af-accent text-white",
                  status === "upcoming" && "bg-af-border text-af-text-secondary"
                )}
              >
                {status === "complete" ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white">{step.title}</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-af-text-secondary">{step.description}</p>
                {step.actionLabel && (
                  <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-af-accent">
                    {step.actionLabel} <ChevronRight className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>
          )

          return (
            <li key={`${index}-${step.title}`} aria-current={status === "current" ? "step" : undefined}>
              {step.href ? (
                <Link href={step.href} className="block h-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-af-accent">
                  {body}
                </Link>
              ) : body}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
