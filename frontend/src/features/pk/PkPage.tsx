import { useCallback, useEffect, useState } from 'react'
import type { PkPreset } from '../../contracts/pk'
import { Footer } from '../../components/shell/Footer'
import { ContractErrorPane } from '../../components/ui/ContractErrorPane'
import { Skeleton } from '../../components/ui/Misc'
import { fetchPresets, PK_SERVICE_DOWN_MESSAGE } from './api'
import { applyPatch, buildRequest, presetToForm, validateForm } from './form'
import type { PkErrors, PkForm } from './form'
import { useSimulation } from './useSimulation'
import { ControlsCard } from './components/ControlsCard'
import { InterpretationPanel } from './components/InterpretationPanel'
import { MetricsCards } from './components/MetricsCards'
import { PkBanner } from './components/PkBanner'
import { PkChart } from './components/PkChart'
import { ServiceDownPane } from './components/ServiceDownPane'

const DEFAULT_PRESET_ID = 'synthetic-x'

export function PkPage() {
  const [presets, setPresets] = useState<PkPreset[]>([])
  const [presetError, setPresetError] = useState<string | null>(null)
  const [form, setForm] = useState<PkForm | null>(null)
  const [errors, setErrors] = useState<PkErrors>({})
  const { state, result, message, contractPath, run, reset } = useSimulation()

  const runWith = useCallback(
    (f: PkForm) => {
      const found = validateForm(f)
      setErrors(found)
      if (Object.keys(found).length === 0) void run(buildRequest(f))
    },
    [run],
  )

  const loadPresets = useCallback(() => {
    fetchPresets()
      .then((list) => {
        setPresetError(null)
        setPresets(list)
        const initial = list.find((p) => p.id === DEFAULT_PRESET_ID) ?? list[0]
        if (initial) {
          const f = presetToForm(initial)
          setForm(f)
          runWith(f)
        }
      })
      .catch((err: { message?: string }) => setPresetError(err?.message ?? PK_SERVICE_DOWN_MESSAGE))
  }, [runWith])

  useEffect(() => {
    loadPresets()
  }, [loadPresets])

  const choosePreset = (id: string) => {
    const preset = presets.find((p) => p.id === id)
    if (!preset) return
    const f = presetToForm(preset)
    setForm(f)
    runWith(f)
  }

  const resetForm = () => {
    const preset = presets.find((p) => p.id === form?.presetId)
    if (!preset) return
    const f = presetToForm(preset)
    setForm(f)
    reset()
    runWith(f)
  }

  let right: React.ReactNode
  if (presetError) {
    right = <ServiceDownPane message={presetError} onRetry={loadPresets} />
  } else if (state === 'error') {
    right = <ServiceDownPane message={message ?? PK_SERVICE_DOWN_MESSAGE} onRetry={() => form && runWith(form)} />
  } else if (state === 'contract_error') {
    right = <ContractErrorPane path={contractPath ?? '(root)'} message={message ?? 'Response did not match the expected shape.'} />
  } else if (state === 'success' && result) {
    right = (
      <div className="flex flex-col gap-4">
        <MetricsCards result={result} />
        <PkChart result={result} />
        <InterpretationPanel result={result} />
      </div>
    )
  } else {
    right = (
      <div className="flex flex-col gap-4" aria-busy="true">
        <Skeleton height={110} />
        <Skeleton height={400} dashed />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1380px] flex-col gap-5 px-4 py-6 min-[721px]:px-6">
      <div>
        <h1 className="font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] min-[721px]:text-[26px]">
          Pharmacokinetic Simulator
        </h1>
        <p className="mt-1 max-w-[62ch] text-ink-2">
          Explore how a change in clearance alters predicted concentration over time in a one-compartment oral model.
        </p>
      </div>

      <PkBanner />

      <div className="grid grid-cols-1 items-start gap-5 min-[901px]:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <div>
          {form ? (
            <ControlsCard
              form={form}
              errors={errors}
              presets={presets}
              loading={state === 'loading'}
              onChange={(patch) => setForm((prev) => (prev ? applyPatch(prev, patch) : prev))}
              onPreset={choosePreset}
              onRun={() => runWith(form)}
              onReset={resetForm}
            />
          ) : (
            <Skeleton height={520} />
          )}
        </div>
        <div className="min-w-0">{right}</div>
      </div>

      <Footer />
    </div>
  )
}

export default PkPage
