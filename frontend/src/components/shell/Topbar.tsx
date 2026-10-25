import { ChevronRight, Database, FlaskConical, ShieldCheck } from 'lucide-react'
import { Chip } from '../ui/Chip'
import { MEDICATION_REVIEW_MOCK_MODE } from '../../lib/config'

export function Topbar({ title, variant = 'review' }: { title: string; variant?: 'review' | 'pk' }) {
  return (
    <header className="sticky top-0 z-10 flex min-h-[60px] items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5 max-[559px]:flex-wrap min-[721px]:px-6">
      <div className="flex min-w-0 items-center gap-2 text-[13px] text-ink-3 max-[559px]:w-full">
        {/* Below 640px only the page title shows, so the chips and avatar never crowd it. */}
        <span className="hidden min-[640px]:inline">GeneCollision</span>
        <ChevronRight size={14} className="hidden min-[640px]:block" />
        <b className="font-semibold text-ink">{title}</b>
      </div>
      <div className="flex flex-none flex-nowrap items-center justify-end gap-2 max-[559px]:w-full max-[559px]:justify-start min-[721px]:gap-2.5">
        {variant === 'pk' ? (
          <Chip variant="exp" icon={<FlaskConical size={13} />}>
            <span className="hidden min-[560px]:inline">Research demo · synthetic parameters</span>
            <span className="min-[560px]:hidden">Research demo</span>
          </Chip>
        ) : MEDICATION_REVIEW_MOCK_MODE ? (
          <Chip variant="exp" icon={<FlaskConical size={13} />}>
            <span className="hidden min-[560px]:inline">Demo fixtures, not a live engine</span>
            <span className="min-[560px]:hidden">Demo fixtures</span>
          </Chip>
        ) : (
          <Chip variant="teal" icon={<ShieldCheck size={13} />}>
            <span className="hidden min-[560px]:inline">Guideline engine v1.0 · demo inhibitor list</span>
            <span className="min-[560px]:hidden">Engine v1.0 · demo</span>
          </Chip>
        )}
        <Chip variant="amber" icon={<Database size={13} />}>
          <span className="hidden min-[560px]:inline">Synthetic data</span>
          <span className="min-[560px]:hidden">Synthetic</span>
        </Chip>
        <span
          className="grid h-8 w-8 flex-none place-items-center max-[559px]:ml-auto rounded-full bg-navy-900 font-display text-xs font-bold text-white"
          title="Demo clinician"
        >
          DC
        </span>
      </div>
    </header>
  )
}
