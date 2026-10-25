import { useState } from 'react'
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SimulateResponse } from '../../../contracts/pk'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Fine } from '../../../components/ui/Misc'
import { ALTERED_COLOR, BASELINE_COLOR, alteredLegend, buildChartData, chartSummary } from './chartData'
import type { ChartRow } from './chartData'

interface TipProps {
  active?: boolean
  payload?: { payload: ChartRow }[]
  label?: number
  alteredName: string | null
}

function PkTooltip({ active, payload, alteredName }: TipProps) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] shadow-[var(--shadow-sh2)]">
      <div className="font-semibold">Time {row.t.toFixed(2)} h</div>
      <div style={{ color: BASELINE_COLOR }}>Baseline: {row.baseline.toFixed(4)} mg/L</div>
      {alteredName && row.altered !== undefined && (
        <div style={{ color: ALTERED_COLOR }}>
          {alteredName}: {row.altered.toFixed(4)} mg/L
        </div>
      )}
    </div>
  )
}

export function PkChart({ result }: { result: SimulateResponse }) {
  const [showTable, setShowTable] = useState(false)
  const data = buildChartData(result)
  const alteredName = alteredLegend(result)
  const mc = result.monteCarlo

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-1">Concentration–time curve</CardTitle>
        <button
          type="button"
          aria-expanded={showTable}
          onClick={() => setShowTable((v) => !v)}
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-semibold hover:bg-surface-2"
        >
          {showTable ? 'Hide data table' : 'View data table'}
        </button>
      </CardHeader>
      <div className="p-4">
        <div role="img" aria-label={chartSummary(result)} className="h-[340px] w-full min-[721px]:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 28, left: 8 }}>
              <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                type="number"
                domain={[0, result.durationHours]}
                tickCount={9}
                label={{ value: 'Time (h)', position: 'insideBottom', offset: -16 }}
              />
              <YAxis label={{ value: 'Predicted concentration (mg/L)', angle: -90, position: 'insideLeft', offset: 4, style: { textAnchor: 'middle' } }} />
              <Tooltip content={<PkTooltip alteredName={alteredName} />} />
              <Legend verticalAlign="top" height={30} />
              {mc && (
                <Area dataKey="baselineBand" name="Baseline p5–p95 (assumed)" stroke="none" fill={BASELINE_COLOR} fillOpacity={0.14} isAnimationActive={false} legendType="rect" />
              )}
              {mc?.altered && alteredName && (
                <Area dataKey="alteredBand" name={`${alteredName} p5–p95 (assumed)`} stroke="none" fill={ALTERED_COLOR} fillOpacity={0.16} isAnimationActive={false} legendType="rect" />
              )}
              <Line dataKey="baseline" name="Baseline" stroke={BASELINE_COLOR} strokeWidth={2.5} dot={false} isAnimationActive={false} />
              {alteredName && (
                <Line dataKey="altered" name={alteredName} stroke={ALTERED_COLOR} strokeWidth={2.5} strokeDasharray="7 5" dot={false} isAnimationActive={false} />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {mc && (
          <Fine className="mt-2">
            Shaded bands: 5th–95th percentile of {mc.samples} Monte Carlo draws. Assumed demonstration distribution, not a validated
            interval.
          </Fine>
        )}
        {showTable && <DataTable result={result} />}
      </div>
    </Card>
  )
}

function DataTable({ result }: { result: SimulateResponse }) {
  const mc = result.monteCarlo
  const alteredName = alteredLegend(result)
  return (
    <div className="mt-3 max-h-[320px] overflow-auto rounded-lg border border-line-2" tabIndex={0} role="region" aria-label="Plotted values table">
      <table className="w-full border-collapse text-[12.5px]">
        <caption className="sr-only">Predicted concentration (mg/L) at each time point</caption>
        <thead className="sticky top-0 bg-surface-2">
          <tr>
            <th scope="col" className="px-2 py-1.5 text-left">Time (h)</th>
            <th scope="col" className="px-2 py-1.5 text-right">Baseline (mg/L)</th>
            {alteredName && <th scope="col" className="px-2 py-1.5 text-right">{alteredName} (mg/L)</th>}
            {mc && <th scope="col" className="px-2 py-1.5 text-right">Baseline p5 / p95</th>}
          </tr>
        </thead>
        <tbody>
          {result.timeHours.map((t, i) => (
            <tr key={i} className="border-t border-line-2">
              <th scope="row" className="px-2 py-1 text-left font-normal">{t}</th>
              <td className="px-2 py-1 text-right">{result.baseline.concentrationMgPerL[i]}</td>
              {alteredName && <td className="px-2 py-1 text-right">{result.altered?.concentrationMgPerL[i]}</td>}
              {mc && (
                <td className="px-2 py-1 text-right">
                  {mc.baseline.concentrationBands.p5[i]} / {mc.baseline.concentrationBands.p95[i]}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
