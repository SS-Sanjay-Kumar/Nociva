import { useEffect, useState } from 'react'
import type { Medication, PatientProfile } from '../../types'
import { fetchMedications, fetchPatients } from './api'
import { useMedicationAssessment } from './useMedicationAssessment'
import { SCENARIOS } from './mocks/scenarios'
import { PatientCard } from './components/PatientCard'
import { GeneticsCard } from './components/GeneticsCard'
import { MedsCard } from './components/MedsCard'
import { RunBar } from './components/RunBar'
import { ScenarioStrip } from './components/ScenarioStrip'
import { IdlePane } from './components/IdlePane'
import { LoadingPane } from './components/LoadingPane'
import { EnginePane } from './components/EnginePane'
import { VerdictCard } from './components/VerdictCard'
import { MechanismCard } from './components/MechanismCard'
import { EvidenceCard } from './components/EvidenceCard'
import { LimitsCard } from './components/LimitsCard'
import { StaleBanner } from './components/StaleBanner'
import { ExplorerLinkCard } from './components/ExplorerLinkCard'
import { PKSlot } from './components/PKSlot'
import { Footer } from '../../components/shell/Footer'

export function ReviewPage() {
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [bootstrapping, setBootstrapping] = useState(true)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [medicationIds, setMedicationIds] = useState<string[]>([])
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null)

  const { state, result, errorMessage, ranKey, submit, reset } = useMedicationAssessment()

  useEffect(() => {
    Promise.all([fetchPatients(), fetchMedications()])
      .then(([p, m]) => {
        setPatients(p)
        setMedications(m)
        if (p[0]) {
          setSelectedPatientId(p[0].id)
          const defaults = SCENARIOS[0]
          setMedicationIds(defaults.medicationIds)
          setActiveScenarioId(defaults.id)
        }
      })
      .finally(() => setBootstrapping(false))
  }, [])

  const patient = patients.find((p) => p.id === selectedPatientId) ?? null
  const currentKey = patient ? `${patient.id}|${medicationIds.join(',')}` : null
  const stale = state === 'success' && ranKey !== null && currentKey !== ranKey

  const run = (simulateError = false) => {
    if (!patient) return
    submit(patient, medicationIds, { simulateError })
  }

  const pickPatient = (p: PatientProfile) => {
    setSelectedPatientId(p.id)
    setMedicationIds([])
    setActiveScenarioId(null)
    reset()
  }

  const toggleMedication = (medicationId: string, add: boolean) => {
    setActiveScenarioId(null)
    setMedicationIds((prev) => (add ? [...prev, medicationId] : prev.filter((id) => id !== medicationId)))
  }

  const pickScenario = (scenarioId: string) => {
    const scenario = SCENARIOS.find((s) => s.id === scenarioId)
    if (!scenario) return
    const scenarioPatient = patients.find((p) => p.id === scenario.patientId)
    if (!scenarioPatient) return
    setSelectedPatientId(scenario.patientId)
    setMedicationIds(scenario.medicationIds)
    setActiveScenarioId(scenarioId)
    submit(scenarioPatient, scenario.medicationIds)
  }

  if (bootstrapping || !patient) {
    return (
      <div className="content mx-auto flex max-w-[1380px] flex-col gap-5 px-4 py-6 min-[721px]:px-6">
        <p className="text-ink-3">Loading patient and medication data…</p>
      </div>
    )
  }

  let pane: React.ReactNode
  if (state === 'idle' || state === 'unsupported') {
    pane = <IdlePane />
  } else if (state === 'loading') {
    pane = <LoadingPane />
  } else if (state === 'error') {
    pane = <EnginePane onRetry={() => run(false)} />
  } else {
    pane = result ? (
      <div className={`flex flex-col gap-4 ${stale ? 'opacity-55' : ''}`}>
        {stale && <StaleBanner onRerun={() => run(false)} />}
        <VerdictCard result={result} patient={patient} />
        <MechanismCard mechanism={result.verdict.mechanism} checks={result.verdict.checks} />
        <div className="grid grid-cols-1 gap-4 min-[901px]:grid-cols-2">
          <EvidenceCard references={result.verdict.references} />
          <LimitsCard missingData={result.verdict.missingData} limitations={result.verdict.limitations} />
        </div>
      </div>
    ) : null
  }

  return (
    <div className="mx-auto flex max-w-[1380px] flex-col gap-5 px-4 py-6 min-[721px]:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] min-[721px]:text-[26px]">
            Medication review
          </h1>
          <p className="mt-1 max-w-[62ch] text-ink-2">
            Check a synthetic patient's medications against evidence-supported pharmacogenetic gene–drug–drug
            associations.
          </p>
        </div>
      </div>

      <ScenarioStrip activeScenarioId={activeScenarioId} onPick={pickScenario} onSimulateError={() => run(true)} />

      <div className="grid grid-cols-1 items-start gap-5 min-[901px]:grid-cols-[minmax(340px,400px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <PatientCard patients={patients} selectedId={patient.id} onPick={pickPatient} />
          <GeneticsCard patient={patient} />
          <MedsCard
            medications={medications}
            selectedIds={medicationIds}
            onAdd={(id) => toggleMedication(id, true)}
            onRemove={(id) => toggleMedication(id, false)}
          />
          <RunBar medicationCount={medicationIds.length} loading={state === 'loading'} onRun={() => run(false)} />
        </div>
        <div className="flex flex-col gap-4">
          {pane}
          {errorMessage && state === 'unsupported' && <p className="text-sm text-ink-3">{errorMessage}</p>}
          <ExplorerLinkCard />
          <PKSlot patientId={patient.id} medicationIds={medicationIds} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
