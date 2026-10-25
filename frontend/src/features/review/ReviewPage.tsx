import { useEffect, useMemo, useState } from 'react'
import type { Medication, PatientProfile } from '../../types'
import { fetchMedications, fetchPatients } from './api'
import { liveMedication } from './liveApi'
import { useMedicationSearch } from './useMedicationSearch'
import { MEDICATION_REVIEW_MOCK_MODE } from '../../lib/config'
import { AssociationsCard } from './components/AssociationsCard'
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
import { PkLinkCard } from './components/PkLinkCard'
import { Footer } from '../../components/shell/Footer'
import { ContractErrorPane } from '../../components/ui/ContractErrorPane'

export function ReviewPage() {
  const [patients, setPatients] = useState<PatientProfile[]>([])
  // Every medication the page has seen (initial list, search results, scenarios); resolves selected ids.
  const [medications, setMedications] = useState<Medication[]>([])
  const [bootNote, setBootNote] = useState<string | null>(null)
  const live = !MEDICATION_REVIEW_MOCK_MODE
  const search = useMedicationSearch([])

  const remember = (meds: Medication[]) =>
    setMedications((prev) => [...prev, ...meds.filter((m) => !prev.some((p) => p.id === m.id))])
  const [bootstrapping, setBootstrapping] = useState(true)
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [medicationIds, setMedicationIds] = useState<string[]>([])
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null)

  const { state, result, errorMessage, contractErrorPath, ranKey, submit, reset } = useMedicationAssessment()

  useEffect(() => {
    // Live mode must not hide a dead service: patients still load, the medication list reports the failure.
    const medsRequest = fetchMedications().catch((err: unknown) => {
      setBootNote(err instanceof Error ? err.message : ((err as { message?: string })?.message ?? 'Medication list unavailable'))
      return [] as Medication[]
    })
    Promise.all([fetchPatients(), medsRequest])
      .then(([p, m]) => {
        setPatients(p)
        const defaults = SCENARIOS[0]
        const defaultIds = live ? defaults.liveMedicationIds : defaults.medicationIds
        setMedications([...m, ...(live ? defaultIds.map(liveMedication).filter((x) => !m.some((y) => y.id === x.id)) : [])])
        search.setResults(m)
        if (p[0]) {
          setSelectedPatientId(p[0].id)
          setMedicationIds(defaultIds)
          setActiveScenarioId(defaults.id)
        }
      })
      .finally(() => setBootstrapping(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedMedications = useMemo(
    () => medicationIds.map((id) => medications.find((m) => m.id === id)).filter((m): m is Medication => Boolean(m)),
    [medicationIds, medications],
  )

  const patient = patients.find((p) => p.id === selectedPatientId) ?? null
  const currentKey = patient ? `${patient.id}|${medicationIds.join(',')}` : null
  const stale = state === 'success' && ranKey !== null && currentKey !== ranKey

  const run = (simulateError = false) => {
    if (!patient) return
    submit(patient, selectedMedications, { simulateError })
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
    const ids = live ? scenario.liveMedicationIds : scenario.medicationIds
    const meds = live ? ids.map(liveMedication) : ids.map((id) => medications.find((m) => m.id === id)).filter((m): m is Medication => Boolean(m))
    if (live) remember(meds)
    setMedicationIds(ids)
    setActiveScenarioId(scenarioId)
    submit(scenarioPatient, meds)
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
    pane = <EnginePane onRetry={() => run(false)} message={live ? (errorMessage ?? undefined) : undefined} />
  } else if (state === 'contract_error') {
    pane = <ContractErrorPane path={contractErrorPath ?? '(root)'} message={errorMessage ?? 'Response did not match the expected shape.'} />
  } else {
    pane = result ? (
      <div className={`flex flex-col gap-4 ${stale ? 'opacity-55' : ''}`}>
        {stale && <StaleBanner onRerun={() => run(false)} />}
        <VerdictCard result={result} patient={patient} />
        <MechanismCard mechanism={result.verdict.mechanism} checks={result.verdict.checks} />
        {result.verdict.associations && result.verdict.associations.length > 0 && (
          <AssociationsCard associations={result.verdict.associations} />
        )}
        <div className="grid grid-cols-1 gap-4 min-[901px]:grid-cols-2">
          <EvidenceCard references={result.verdict.references} associations={result.verdict.associations} />
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
          {bootNote && (
            <p role="status" className="mt-2 text-sm text-crit-700">
              {bootNote}. Medication search is unavailable until the backend is running.
            </p>
          )}
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
            candidates={live ? search.results : undefined}
            onQueryChange={live ? (q) => search.search(q, remember) : undefined}
          />
          <RunBar medicationCount={medicationIds.length} loading={state === 'loading'} onRun={() => run(false)} />
        </div>
        <div className="flex flex-col gap-4">
          {pane}
          {errorMessage && state === 'unsupported' && <p className="text-sm text-ink-3">{errorMessage}</p>}
          <ExplorerLinkCard />
          <PkLinkCard />
        </div>
      </div>

      <Footer />
    </div>
  )
}
