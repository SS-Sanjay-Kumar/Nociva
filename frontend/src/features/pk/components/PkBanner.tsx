import { FlaskConical } from 'lucide-react'
import { Chip } from '../../../components/ui/Chip'

export function PkBanner() {
  return (
    <div role="note" className="flex flex-wrap items-start gap-3.5 rounded-[var(--radius-md)] border-[1.5px] border-dashed border-exp-300 bg-exp-50 p-4 text-exp-800">
      <FlaskConical size={24} className="flex-none" />
      <div className="min-w-[260px] flex-1">
        <b className="block font-display text-[15px] font-extrabold">Experimental simulation</b>
        <p className="mt-0.5 max-w-[70ch] text-[13.5px] text-ink-2">
          Research demonstration with synthetic parameters. Not a clinical dosing or toxicity tool.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Chip variant="exp">Synthetic parameters</Chip>
        <Chip variant="exp">Separate from clinical verdicts</Chip>
      </div>
    </div>
  )
}
