import { ChevronDown, Loader2, Play, RotateCcw } from 'lucide-react'
import type { PkPreset } from '../../../contracts/pk'
import { PK_BOUNDS } from '../../../contracts/pk'
import { Button } from '../../../components/ui/Button'
import { Card, CardHeader, CardTitle } from '../../../components/ui/Card'
import { Fine } from '../../../components/ui/Misc'
import type { PkErrors, PkForm } from '../form'

const INPUT =
  'h-10 w-full rounded-[10px] border border-line bg-surface px-3 text-ink focus:border-teal-600 focus:outline-none aria-[invalid=true]:border-crit-700'

function Field({
  id,
  label,
  unit,
  value,
  error,
  onChange,
  step = 'any',
  type = 'number',
}: {
  id: string
  label: string
  unit?: string
  value: string
  error?: string
  onChange: (v: string) => void
  step?: string
  type?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12.5px] font-semibold text-ink-2">
        {label}
        {unit && <span className="font-normal text-ink-3"> ({unit})</span>}
      </label>
      <input
        id={id}
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        step={type === 'number' ? step : undefined}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
      {error && (
        <p id={`${id}-err`} className="mt-1 text-[12.5px] text-crit-700">
          {error}
        </p>
      )}
    </div>
  )
}

export function ControlsCard({
  form,
  errors,
  presets,
  loading,
  onChange,
  onPreset,
  onRun,
  onReset,
}: {
  form: PkForm
  errors: PkErrors
  presets: PkPreset[]
  loading: boolean
  onChange: (patch: Partial<PkForm>) => void
  onPreset: (id: string) => void
  onRun: () => void
  onReset: () => void
}) {
  const set = (key: keyof PkForm) => (v: string) => onChange({ [key]: v } as Partial<PkForm>)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex-1">Simulation parameters</CardTitle>
      </CardHeader>
      <form
        className="flex flex-col gap-3.5 p-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          onRun()
        }}
      >
        <div>
          <label htmlFor="pk-preset" className="mb-1 block text-[12.5px] font-semibold text-ink-2">
            Preset (synthetic compound)
          </label>
          <select id="pk-preset" value={form.presetId} onChange={(e) => onPreset(e.target.value)} className={INPUT}>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.request.compoundName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field id="pk-dose" label="Dose" unit="mg" value={form.doseMg} error={errors.doseMg} onChange={set('doseMg')} />
          <Field id="pk-f" label="Bioavailability F" value={form.bioavailability} error={errors.bioavailability} onChange={set('bioavailability')} step="0.05" />
          <Field id="pk-v" label="Volume V" unit="L" value={form.volumeL} error={errors.volumeL} onChange={set('volumeL')} />
          <Field id="pk-cl" label="Clearance CL" unit="L/h" value={form.clearanceLPerH} error={errors.clearanceLPerH} onChange={set('clearanceLPerH')} />
          <Field id="pk-ka" label="Absorption rate ka" unit="1/h" value={form.absorptionRatePerH} error={errors.absorptionRatePerH} onChange={set('absorptionRatePerH')} />
          <Field id="pk-dur" label="Duration" unit="h" value={form.durationHours} error={errors.durationHours} onChange={set('durationHours')} />
        </div>

        <fieldset className="flex flex-col gap-2.5 rounded-[10px] border border-dashed border-exp-300 bg-exp-50/50 p-3">
          <legend className="px-1 text-[12.5px] font-semibold text-exp-800">Hypothetical scenario (altered clearance)</legend>
          <div role="radiogroup" aria-label="Scenario type" className="flex flex-col gap-1.5 text-[13.5px]">
            <label className="flex items-center gap-2">
              <input type="radio" name="pk-mode" checked={form.scenarioMode === 'multiplier'} onChange={() => onChange({ scenarioMode: 'multiplier' })} />
              Clearance multiplier
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="pk-mode" checked={form.scenarioMode === 'explicit'} onChange={() => onChange({ scenarioMode: 'explicit' })} />
              Explicit altered clearance
            </label>
          </div>
          {form.scenarioMode === 'multiplier' ? (
            <div>
              <label htmlFor="pk-mult" className="mb-1 block text-[12.5px] font-semibold text-ink-2">
                Multiplier: ×{form.clearanceMultiplier}
              </label>
              <input
                id="pk-mult"
                type="range"
                min={PK_BOUNDS.clearanceMultiplier.min}
                max={PK_BOUNDS.clearanceMultiplier.max}
                step={0.1}
                value={Number(form.clearanceMultiplier) || PK_BOUNDS.clearanceMultiplier.min}
                onChange={(e) => onChange({ clearanceMultiplier: e.target.value })}
                aria-describedby={errors.clearanceMultiplier ? 'pk-mult-err' : undefined}
                className="w-full"
              />
              {errors.clearanceMultiplier && (
                <p id="pk-mult-err" className="mt-1 text-[12.5px] text-crit-700">
                  {errors.clearanceMultiplier}
                </p>
              )}
            </div>
          ) : (
            <Field id="pk-alt" label="Altered clearance" unit="L/h" value={form.alteredClearanceLPerH} error={errors.alteredClearanceLPerH} onChange={set('alteredClearanceLPerH')} />
          )}
          <Field id="pk-label" label="Scenario label" type="text" value={form.label} error={errors.label} onChange={set('label')} />
        </fieldset>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-[13.5px] font-medium">
            <input type="checkbox" checked={form.mcEnabled} onChange={(e) => onChange({ mcEnabled: e.target.checked })} />
            Monte Carlo variability (assumed distributions)
          </label>
          {form.mcEnabled && <Field id="pk-samples" label="Samples" value={form.samples} error={errors.samples} onChange={set('samples')} step="1" />}
        </div>

        <details className="rounded-[10px] border border-line-2 bg-surface-2">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2.5 text-[13.5px] font-semibold">
            <ChevronDown size={15} aria-hidden="true" />
            Contextual information (not used in the calculation)
          </summary>
          <div className="grid grid-cols-2 gap-3 p-3">
            <Field id="pk-age" label="Age" unit="years" value={form.ageYears} onChange={set('ageYears')} />
            <Field id="pk-wt" label="Weight" unit="kg" value={form.weightKg} onChange={set('weightKg')} />
            <Field id="pk-egfr" label="eGFR" value={form.egfr} onChange={set('egfr')} />
            <Field id="pk-phen" label="CYP phenotype" type="text" value={form.cypPhenotype} onChange={set('cypPhenotype')} />
            <div className="col-span-2">
              <Field id="pk-conmed" label="Concomitant medication" type="text" value={form.concomitantMedication} onChange={set('concomitantMedication')} />
            </div>
            <div className="col-span-2">
              <Fine>Echoed back for context only. It never changes a curve or a metric.</Fine>
            </div>
          </div>
        </details>

        <div className="flex gap-2">
          <Button variant="primary" size="block" type="submit" disabled={loading} className="flex-1">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {loading ? 'Running…' : 'Run simulation'}
          </Button>
          <Button type="button" onClick={onReset} disabled={loading} className="flex-none">
            <RotateCcw size={15} />
            Reset
          </Button>
        </div>
      </form>
    </Card>
  )
}
