import { PK_BOUNDS } from '../../contracts/pk'
import type { PkPreset, SimulateRequest } from '../../contracts/pk'

/** Form values are strings so a field can be edited freely; they are validated and converted on Run. */
export interface PkForm {
  presetId: string
  compoundName: string
  doseMg: string
  bioavailability: string
  volumeL: string
  clearanceLPerH: string
  absorptionRatePerH: string
  durationHours: string
  scenarioMode: 'multiplier' | 'explicit'
  clearanceMultiplier: string
  alteredClearanceLPerH: string
  label: string
  /** True once the user typed their own label; until then the label follows the scenario values. */
  labelTouched: boolean
  mcEnabled: boolean
  samples: string
  ageYears: string
  weightKg: string
  egfr: string
  cypPhenotype: string
  concomitantMedication: string
}

export type PkErrors = Partial<Record<keyof PkForm, string>>

export function presetToForm(preset: PkPreset): PkForm {
  const r = preset.request
  const explicit = r.comparison?.alteredClearanceLPerH !== undefined
  return {
    presetId: preset.id,
    compoundName: r.compoundName,
    doseMg: String(r.doseMg),
    bioavailability: String(r.bioavailability),
    volumeL: String(r.volumeL),
    clearanceLPerH: String(r.clearanceLPerH),
    absorptionRatePerH: String(r.absorptionRatePerH),
    durationHours: String(r.durationHours),
    scenarioMode: explicit ? 'explicit' : 'multiplier',
    clearanceMultiplier: String(r.comparison?.clearanceMultiplier ?? 0.7),
    alteredClearanceLPerH: String(r.comparison?.alteredClearanceLPerH ?? ''),
    label: r.comparison?.label ?? 'Hypothetical altered clearance',
    labelTouched: false,
    mcEnabled: false,
    samples: '300',
    ageYears: '',
    weightKg: '',
    egfr: '',
    cypPhenotype: '',
    concomitantMedication: '',
  }
}

function num(v: string): number {
  return v.trim() === '' ? NaN : Number(v)
}

/** Same bounds as app/models/pk.py. Messages are plain language. */
export function validateForm(f: PkForm): PkErrors {
  const e: PkErrors = {}
  const b = PK_BOUNDS
  const dose = num(f.doseMg)
  if (!(dose >= b.doseMg.min && dose <= b.doseMg.max)) e.doseMg = `Dose must be a number from ${b.doseMg.min} to ${b.doseMg.max} mg`
  const bio = num(f.bioavailability)
  if (!(bio > 0 && bio <= b.bioavailability.max)) e.bioavailability = 'Bioavailability must be greater than 0 and at most 1'
  for (const [key, label] of [
    ['volumeL', 'Volume'],
    ['clearanceLPerH', 'Clearance'],
    ['absorptionRatePerH', 'Absorption rate'],
  ] as const) {
    if (!(num(f[key]) > 0)) e[key] = `${label} must be a number greater than 0`
  }
  const dur = num(f.durationHours)
  if (!(dur >= b.durationHours.min && dur <= b.durationHours.max)) e.durationHours = `Duration must be from ${b.durationHours.min} to ${b.durationHours.max} hours`
  if (f.scenarioMode === 'multiplier') {
    const m = num(f.clearanceMultiplier)
    if (!(m >= b.clearanceMultiplier.min && m <= b.clearanceMultiplier.max)) e.clearanceMultiplier = `Multiplier must be from ${b.clearanceMultiplier.min} to ${b.clearanceMultiplier.max}`
  } else if (!(num(f.alteredClearanceLPerH) > 0)) {
    e.alteredClearanceLPerH = 'Altered clearance must be a number greater than 0'
  }
  if (f.label.trim() === '') e.label = 'Give the hypothetical scenario a label'
  if (f.mcEnabled) {
    const s = num(f.samples)
    if (!(Number.isInteger(s) && s >= b.samples.min && s <= b.samples.max)) e.samples = `Samples must be a whole number from ${b.samples.min} to ${b.samples.max}`
  }
  return e
}

/** Builds the backend request. Contextual fields are sent only when filled and never derived from anything. */
export function buildRequest(f: PkForm): SimulateRequest {
  const request: SimulateRequest = {
    compoundName: f.compoundName,
    route: 'oral',
    doseMg: Number(f.doseMg),
    bioavailability: Number(f.bioavailability),
    volumeL: Number(f.volumeL),
    clearanceLPerH: Number(f.clearanceLPerH),
    absorptionRatePerH: Number(f.absorptionRatePerH),
    durationHours: Number(f.durationHours),
    comparison:
      f.scenarioMode === 'multiplier'
        ? { clearanceMultiplier: Number(f.clearanceMultiplier), label: f.label.trim() }
        : { alteredClearanceLPerH: Number(f.alteredClearanceLPerH), label: f.label.trim() },
    monteCarlo: f.mcEnabled ? { enabled: true, samples: Number(f.samples) } : { enabled: false },
  }
  const contextual: NonNullable<SimulateRequest['contextual']> = {}
  if (f.ageYears.trim()) contextual.ageYears = Number(f.ageYears)
  if (f.weightKg.trim()) contextual.weightKg = Number(f.weightKg)
  if (f.egfr.trim()) contextual.egfr = Number(f.egfr)
  if (f.cypPhenotype.trim()) contextual.cypPhenotype = f.cypPhenotype.trim()
  if (f.concomitantMedication.trim()) contextual.concomitantMedication = f.concomitantMedication.trim()
  if (Object.keys(contextual).length > 0) request.contextual = contextual
  return request
}

export function autoLabel(f: PkForm): string {
  return f.scenarioMode === 'multiplier'
    ? `Hypothetical: clearance × ${f.clearanceMultiplier}`
    : `Hypothetical: clearance of ${f.alteredClearanceLPerH || '?'} L/h`
}

/** Applies a form edit. An untouched label is regenerated so it never describes stale scenario values. */
export function applyPatch(form: PkForm, patch: Partial<PkForm>): PkForm {
  const next = { ...form, ...patch }
  if ('label' in patch) next.labelTouched = true
  const scenarioChanged = 'clearanceMultiplier' in patch || 'alteredClearanceLPerH' in patch || 'scenarioMode' in patch
  if (scenarioChanged && !next.labelTouched) next.label = autoLabel(next)
  return next
}
