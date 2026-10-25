import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'default' | 'primary' | 'exp' | 'ghost'
export type ButtonSize = 'default' | 'sm' | 'block'

const VARIANTS: Record<ButtonVariant, string> = {
  default: 'bg-surface border-line text-ink hover:border-[#B9C7D8] hover:bg-surface-2 disabled:opacity-50',
  // Disabled primary stays fully opaque (slate fill) so the white label keeps >= 4.5:1 contrast.
  primary:
    'bg-navy-900 border-navy-900 text-white hover:bg-navy-800 hover:border-navy-800 disabled:border-ink-3 disabled:bg-ink-3 disabled:hover:bg-ink-3',
  exp: 'bg-exp-600 border-exp-600 text-white hover:bg-exp-800 hover:border-exp-800 disabled:opacity-50',
  ghost: 'bg-transparent border-transparent text-ink-2 hover:bg-slate-100 disabled:opacity-50',
}

const SIZES: Record<ButtonSize, string> = {
  default: 'px-4 py-2.5 text-sm rounded-[10px]',
  sm: 'px-3 py-1.5 text-[13px] rounded-lg',
  block: 'w-full px-4 py-3.5 text-[15px] rounded-[10px]',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

export function Button({ variant = 'default', size = 'default', className = '', children, ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 border font-semibold leading-tight transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
