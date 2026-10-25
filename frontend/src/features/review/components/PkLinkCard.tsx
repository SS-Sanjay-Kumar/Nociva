import { ArrowRight, LineChart } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Navigation-only bridge to the PK simulator, like ExplorerLinkCard. It never
 * passes the verdict, phenotype, patient or medication data to the PK page.
 */
export function PkLinkCard() {
  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-[var(--radius-md)] border-[1.5px] border-dashed border-exp-300 bg-exp-50 p-4">
      <LineChart size={22} className="text-exp-600" />
      <div className="min-w-0 flex-1">
        <b className="block font-display font-extrabold text-exp-800">Explore a hypothetical PK scenario</b>
        <span className="text-[13px] text-ink-2">Uses synthetic compounds only. Not connected to the assessment above.</span>
      </div>
      <Link
        to="/pk"
        className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold hover:border-[#B9C7D8] hover:bg-surface-2"
      >
        Open PK simulator
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}
