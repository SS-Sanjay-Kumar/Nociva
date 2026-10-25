import type { ReactNode } from 'react'

export function Card({ children, className = '', ...rest }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={`min-w-0 rounded-[var(--radius-md)] border border-line bg-surface shadow-[var(--shadow-sh1)] ${className}`}
      {...rest}
    >
      {children}
    </section>
  )
}

export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2.5 border-b border-line-2 px-4 py-3.5 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-display font-bold text-[15px] tracking-[-0.005em] ${className}`}>{children}</h2>
  )
}

export function CardSub({ children }: { children: ReactNode }) {
  return <div className="text-[12.5px] text-ink-3">{children}</div>
}

export function CardBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 ${className}`}>{children}</div>
}
