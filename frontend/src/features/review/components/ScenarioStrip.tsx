import { AlertCircle, CircleHelp, Search, TriangleAlert } from 'lucide-react'
import { SCENARIOS } from '../mocks/scenarios'

const ICONS = { found: TriangleAlert, none: Search, insufficient: CircleHelp } as const

export function ScenarioStrip({
  activeScenarioId,
  onPick,
  onSimulateError,
}: {
  activeScenarioId: string | null
  onPick: (scenarioId: string) => void
  onSimulateError: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Demo scenarios">
      <span className="mr-0.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink-3">Demo scenarios</span>
      {SCENARIOS.map((s) => {
        const key = s.id === 'scen-found' ? 'found' : s.id === 'scen-none' ? 'none' : 'insufficient'
        const Icon = ICONS[key]
        const active = activeScenarioId === s.id
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(s.id)}
            className={`inline-flex items-center gap-1.5 rounded-full border bg-surface px-3 py-1.5 text-[13px] font-medium ${
              active ? 'border-navy-900 shadow-[inset_0_0_0_1px_var(--color-navy-900)]' : 'border-line hover:border-[#B9C7D8] hover:bg-surface-2'
            }`}
          >
            <Icon size={15} />
            {s.label}
          </button>
        )
      })}
      <button
        type="button"
        onClick={onSimulateError}
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-medium hover:border-[#B9C7D8] hover:bg-surface-2"
      >
        <AlertCircle size={15} />
        Simulate engine error
      </button>
    </div>
  )
}
