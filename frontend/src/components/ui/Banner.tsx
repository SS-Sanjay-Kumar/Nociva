import type { ReactNode } from 'react'

export type BannerVariant = 'amber' | 'slate'

const VARIANTS: Record<BannerVariant, string> = {
  amber: 'bg-amber-50 border-amber-200 text-amber-800',
  slate: 'bg-slate-100 border-slate-200 text-navy-700',
}

export function Banner({
  children,
  variant = 'slate',
  role,
}: {
  children: ReactNode
  variant?: BannerVariant
  role?: string
}) {
  return (
    <div
      role={role}
      className={`flex flex-wrap items-center gap-2.5 rounded-[10px] border px-3.5 py-2.5 text-[13.5px] ${VARIANTS[variant]}`}
    >
      {children}
    </div>
  )
}
