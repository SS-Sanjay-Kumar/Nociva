import { useEffect, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import type { Medication, PatientProfile } from '../types'
import { fetchMedications, fetchPatients } from '../api/medicationApi'
import { useMedicationAssessment } from '../hooks/useMedicationAssessment'
import { PatientSelector } from '../components/PatientSelector'
import { MedicationSearch } from '../components/MedicationSearch'
import { AssessmentResultCard } from '../components/AssessmentResultCard'
import { LoadingState, ErrorState, UnsupportedState } from '../components/StatusStates'
import { DisclaimerBanner } from '../components/DisclaimerBanner'

export function MedicationReviewPage() {
  const [patients, setPatients] = useState<PatientProfile[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null)
  const [selectedMedicationIds, setSelectedMedicationIds] = useState<string[]>([])
  const [bootstrapping, setBootstrapping] = useState(true)

  const { state, results, errorMessage, submit } = useMedicationAssessment()

  useEffect(() => {
    Promise.all([fetchPatients(), fetchMedications()])
      .then(([p, m]) => {
        setPatients(p)
        setMedications(m)
      })
      .finally(() => setBootstrapping(false))
  }, [])

  const toggleMedication = (medicationId: string) => {
    setSelectedMedicationIds((prev) =>
      prev.includes(medicationId) ? prev.filter((id) => id !== medicationId) : [...prev, medicationId],
    )
  }

  const handleSubmit = () => {
    if (!selectedPatient) return
    submit(selectedPatient, selectedMedicationIds)
  }

  if (bootstrapping) {
    return <LoadingState label="Loading patient and medication data…" />
  }

  return (
    <div className="space-y-6">
      <DisclaimerBanner>
        <strong>Demonstration mode.</strong> This page always runs against synthetic patients and
        hand-authored evidence fixtures labelled as <code>isMock</code>. No real patient data is used,
        and no clinical verdict is calculated in the browser — results come from fixture data standing
        in for the team's deterministic rule-engine backend.
      </DisclaimerBanner>

      <PatientSelector patients={patients} selectedId={selectedPatient?.id ?? null} onSelect={setSelectedPatient} />

      {selectedPatient && (
        <MedicationSearch
          medications={medications}
          selectedIds={selectedMedicationIds}
          onToggle={toggleMedication}
        />
      )}

      {selectedPatient && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={state === 'loading'}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          <ClipboardList size={16} />
          Run assessment
        </button>
      )}

      {state === 'loading' && <LoadingState label="Running assessment against fixture rules…" />}
      {state === 'error' && errorMessage && <ErrorState message={errorMessage} />}
      {state === 'unsupported' && errorMessage && <UnsupportedState message={errorMessage} />}

      {state === 'success' && results.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-600 mb-2">3. Assessment results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((result) => (
              <AssessmentResultCard key={result.medication.id} result={result} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
