import type { SimulateResponse } from '../../../contracts/pk'

export interface ChartRow {
  t: number
  baseline: number
  altered?: number
  baselineBand?: [number, number]
  alteredBand?: [number, number]
}

export const BASELINE_COLOR = '#1d4ed8'
export const ALTERED_COLOR = '#b45309'

/** The altered series name always says hypothetical: the user's label is used as-is if it already does. */
export function hypotheticalName(label: string): string {
  return /hypothetical/i.test(label) ? label : `${label} (hypothetical)`
}

export function alteredLegend(result: SimulateResponse): string | null {
  return result.altered ? hypotheticalName(result.altered.label) : null
}

/** One row per backend time point. Every value comes from the response; nothing is computed here. */
export function buildChartData(result: SimulateResponse): ChartRow[] {
  const mc = result.monteCarlo
  return result.timeHours.map((t, i) => ({
    t,
    baseline: result.baseline.concentrationMgPerL[i],
    altered: result.altered?.concentrationMgPerL[i],
    baselineBand: mc ? [mc.baseline.concentrationBands.p5[i], mc.baseline.concentrationBands.p95[i]] : undefined,
    alteredBand:
      mc?.altered ? [mc.altered.concentrationBands.p5[i], mc.altered.concentrationBands.p95[i]] : undefined,
  }))
}

export function chartSummary(result: SimulateResponse): string {
  const b = result.baseline.metrics
  let text =
    `Concentration versus time for ${result.compoundName} over ${result.durationHours} hours. ` +
    `Baseline peaks at ${b.cmaxMgPerL.toFixed(2)} mg/L at ${b.tmaxH.toFixed(1)} hours.`
  if (result.altered) {
    const a = result.altered.metrics
    text += ` The hypothetical scenario "${result.altered.label}" peaks at ${a.cmaxMgPerL.toFixed(2)} mg/L at ${a.tmaxH.toFixed(1)} hours.`
  }
  if (result.monteCarlo) text += ' Shaded bands show an assumed demonstration distribution, not a validated interval.'
  return text
}
