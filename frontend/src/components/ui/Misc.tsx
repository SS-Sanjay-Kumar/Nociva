import type { ReactNode } from 'react'

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3 ${className}`}>
      {children}
    </div>
  )
}

export function StepBadge({ children, variant = 'default' }: { children: ReactNode; variant?: 'default' | 'exp' }) {
  return (
    <span
      className={`inline-grid h-[22px] w-[22px] flex-none place-items-center rounded-full font-display text-xs font-bold text-white ${
        variant === 'exp' ? 'bg-exp-600' : 'bg-navy-900'
      }`}
    >
      {children}
    </span>
  )
}

export function Skeleton({ height = 150, dashed = false, className = '' }: { height?: number; dashed?: boolean; className?: string }) {
  return (
    <div
      className={`skel ${dashed ? 'border-[1.5px] border-dashed border-exp-300' : ''} ${className}`}
      style={{ height }}
    />
  )
}

export function Fine({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-[12.5px] text-ink-3 ${className}`}>{children}</p>
}
