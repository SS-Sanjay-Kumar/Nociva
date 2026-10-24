import { LineChart } from 'lucide-react'
import { CardHeader, CardTitle } from '../../../components/ui/Card'
import { Chip } from '../../../components/ui/Chip'
import { Fine } from '../../../components/ui/Misc'

/**
 * Placeholder for the teammate's PK simulation module. It receives only
 * the patient and medication list, and must never receive or display the
 * verdict (see GENECOLLISION_HANDOFF.md section 6.3).
 */
export function PKSlot({ patientId, medicationIds }: { patientId: string; medicationIds: string[] }) {
  return (
    <section aria-labelledby="pk-title" className="rounded-[var(--radius-md)] border-[1.5px] border-dashed border-slate-300 bg-surface">
      <CardHeader className="border-b border-line-2">
        <LineChart size={18} />
        <CardTitle className="flex-1">Pharmacokinetic simulation</CardTitle>
        <Chip variant="miss">Module in development</Chip>
      </CardHeader>
      <div className="flex flex-col gap-3.5 p-4">
        <svg viewBox="0 0 560 190" role="img" aria-label="Placeholder for a concentration-time graph" className="h-auto w-full">
          <g className="stroke-line" strokeWidth={1}>
            {[40, 80, 120].map((y) => (
              <line key={y} x1="52" x2="540" y1={y} y2={y} />
            ))}
          </g>
          <g className="fill-none stroke-ink-3" strokeWidth={1.5}>
            <path d="M52 14V156H540" />
          </g>
          <path
            d="M52 156C90 40 130 30 180 58S300 128 540 148"
            className="fill-none stroke-slate-300"
            strokeWidth={3}
            strokeDasharray="6 7"
          />
          <text x={296} y={182} textAnchor="middle" className="fill-ink-3 text-[11px]">
            Time (h)
          </text>
          <text x={300} y={100} textAnchor="middle" className="fill-ink-3 text-[12px]">
            Concentration-time curve renders here
          </text>
        </svg>
        <Fine>
          Teammate module mounts here. It receives the patient and medication list ({patientId},{' '}
          {medicationIds.length} medications) and returns a time series. It has no influence on the verdict
          above.
        </Fine>
      </div>
    </section>
  )
}
