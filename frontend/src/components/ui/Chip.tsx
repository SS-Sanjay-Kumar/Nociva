import type { ReactNode } from 'react'

export type ChipVariant = 'default' | 'teal' | 'amber' | 'navy' | 'exp' | 'miss' | 'crit'

const VARIANTS: Record<ChipVariant, string> = {
  default: 'bg-surface-2 border-line text-ink-2',
  teal: 'bg-teal-50 border-teal-100 text-teal-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-800',
  navy: 'bg-slate-100 border-slate-200 text-navy-700',
  exp: 'bg-exp-50 border-exp-300 border-dashed text-exp-800',
  miss: 'bg-transparent border-[#AEBBCD] border-dashed text-ink-3',
  crit: 'bg-crit-50 border-crit-200 text-crit-700',
}

export function Chip({
  children,
  variant = 'default',
  icon,
  className = '',
}: {
  children: ReactNode
  variant?: ChipVariant
  icon?: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px] text-xs font-medium leading-[1.4] ${VARIANTS[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  )
}
