import { ChevronRight, Database, ShieldCheck } from 'lucide-react'
import { Chip } from '../ui/Chip'

export function Topbar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 flex min-h-[60px] items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5 min-[721px]:px-6">
      <div className="flex min-w-0 items-center gap-2 text-[13px] text-ink-3">
        <span>GeneCollision</span>
        <ChevronRight size={14} />
        <b className="font-semibold text-ink">{title}</b>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        <Chip variant="teal" icon={<ShieldCheck size={13} />} className="hidden min-[560px]:inline-flex">
          Deterministic engine v0.3
        </Chip>
        <Chip variant="amber" icon={<Database size={13} />}>
          Synthetic data
        </Chip>
        <span
          className="grid h-8 w-8 place-items-center rounded-full bg-navy-900 font-display text-xs font-bold text-white"
          title="Demo clinician"
        >
          DC
        </span>
      </div>
    </header>
  )
}
