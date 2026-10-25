import type { SimulateResponse } from '../../../contracts/pk'
import { Card } from '../../../components/ui/Card'
import { Fine } from '../../../components/ui/Misc'
import { alteredLegend } from './chartData'

function fmt(n: number | undefined, digits = 2) {
  return n === undefined ? '—' : n.toFixed(digits)
}

function MetricCard({ name, unit, baseline, altered, alteredName }: { name: string; unit: string; baseline: string; altered?: string; alteredName: string | null }) {
  return (
    <Card className="p-4" data-testid={`metric-${name}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">{name}</div>
      <div className="mt-1 font-display text-[22px] font-extrabold leading-tight">
        {baseline} <span className="text-[13px] font-semibold text-ink-3">{unit}</span>
      </div>
      <div className="text-[12px] text-ink-3">Baseline</div>
      {altered !== undefined && (
        <>
          <div className="mt-2 font-display text-[18px] font-bold text-amber-800">
            {altered} <span className="text-[12px] font-semibold text-ink-3">{unit}</span>
          </div>
          <div className="text-[12px] text-ink-3">{alteredName}</div>
        </>
      )}
    </Card>
  )
}

export function MetricsCards({ result }: { result: SimulateResponse }) {
  const b = result.baseline.metrics
  const a = result.altered?.metrics
  const alteredName = alteredLegend(result)
  const pct = result.altered?.relativeExposure?.aucPercentChange
  const ratio = result.altered?.relativeExposure?.aucRatio
  const u = result.units
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3 min-[1101px]:grid-cols-4">
        <MetricCard name="Cmax" unit={u.concentration} baseline={fmt(b.cmaxMgPerL, 3)} altered={a && fmt(a.cmaxMgPerL, 3)} alteredName={alteredName} />
        <MetricCard name="Tmax" unit={u.time} baseline={fmt(b.tmaxH, 2)} altered={a && fmt(a.tmaxH, 2)} alteredName={alteredName} />
        <MetricCard name="AUC0-T" unit={u.auc} baseline={fmt(b.aucMgHPerL, 3)} altered={a && fmt(a.aucMgHPerL, 3)} alteredName={alteredName} />
        <Card className="p-4" data-testid="metric-Relative AUC change">
          <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-3">Relative AUC change</div>
          <div className="mt-1 font-display text-[22px] font-extrabold leading-tight">
            {pct === undefined ? '—' : `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}
          </div>
          <div className="text-[12px] text-ink-3">
            {ratio === undefined ? 'No comparison' : `AUC ratio ${ratio.toFixed(3)} vs baseline`}
          </div>
        </Card>
      </div>
      <Fine>
        Half-life (ln 2 · V / CL): baseline {fmt(b.halfLifeH, 2)} h
        {a ? `, hypothetical scenario ${fmt(a.halfLifeH, 2)} h` : ''}. AUC0-T is over the {result.durationHours} h simulation window.
      </Fine>
    </div>
  )
}
