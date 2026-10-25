import { ArrowRight, FlaskConical } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Navigation-only bridge to the Molecular Explorer feature. This is the
 * single permitted touch point between features/review and
 * features/molecular — it never passes data in either direction.
 */
export function ExplorerLinkCard() {
  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-[var(--radius-md)] border-[1.5px] border-dashed border-exp-300 bg-exp-50 p-4">
      <FlaskConical size={22} className="text-exp-600" />
      <div className="min-w-0 flex-1">
        <b className="block font-display font-extrabold text-exp-800">Molecular explorer · experimental</b>
        <span className="text-[13px] text-ink-2">
          Compare molecular structures. Separate from this assessment and never used in the verdict.
        </span>
      </div>
      <Link
        to="/molecular"
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold hover:border-[#B9C7D8] hover:bg-surface-2"
      >
        Open explorer
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}
