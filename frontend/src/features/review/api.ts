import type { AssessmentResult, Medication, PatientProfile } from '../../types'
import { MOCK_PATIENTS } from './mocks/patients'
import { MOCK_MEDICATIONS } from './mocks/medications'
import { evaluateCombination } from './mocks/assessments'
import { MEDICATION_REVIEW_MOCK_MODE } from '../../lib/config'
import { apiRequest } from '../../api/client'
import { AssessmentResultSchema, MedicationListSchema, PatientListSchema } from '../../contracts/review'

/**
 * Medication Review API adapter.
 *
 * Controlled by VITE_REVIEW_MODE (see lib/config.ts). In "mock" mode (the
 * default — the teammate's deterministic rule-engine backend contract is
 * not yet live), every function simulates network latency and returns data
 * clearly labelled as a fixture (AssessmentResult.isMock === true). In
 * "live" mode, the exact same functions call the real endpoints documented
 * in INTEGRATION.md §3 through the central, contract-validated API client —
 * no call site elsewhere in the app needs to change either way.
 */

const MOCK_LATENCY_MS = 450

function delay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export async function fetchPatients(): Promise<PatientProfile[]> {
  if (MEDICATION_REVIEW_MOCK_MODE) {
    return delay(MOCK_PATIENTS)
  }
  return apiRequest<PatientProfile[]>('/api/patients', {}, PatientListSchema)
}

export async function fetchMedications(query = ''): Promise<Medication[]> {
  if (MEDICATION_REVIEW_MOCK_MODE) {
    const filtered = query
      ? MOCK_MEDICATIONS.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
      : MOCK_MEDICATIONS
    return delay(filtered)
  }
  const qs = query ? `?query=${encodeURIComponent(query)}` : ''
  return apiRequest<Medication[]>(`/api/medications${qs}`, {}, MedicationListSchema)
}

/** Runs one deterministic assessment for the whole selected medication list. */
export async function runAssessment(
  patient: PatientProfile,
  medicationIds: string[],
  options: { simulateError?: boolean } = {},
): Promise<AssessmentResult> {
  if (!MEDICATION_REVIEW_MOCK_MODE) {
    return apiRequest<AssessmentResult>(
      '/api/assessments',
      { method: 'POST', body: JSON.stringify({ patientId: patient.id, medicationIds }) },
      AssessmentResultSchema,
    )
  }

  if (options.simulateError) {
    await delay(null, 700)
    throw new Error('ENGINE_TIMEOUT')
  }

  const medsById = new Map(MOCK_MEDICATIONS.map((m) => [m.id, m]))
  const medications = medicationIds.map((id) => {
    const med = medsById.get(id)
    if (!med) throw new Error(`Unknown medication id: ${id}`)
    return med
  })

  const verdict = evaluateCombination(patient, medicationIds, medsById)

  const result: AssessmentResult = {
    patientId: patient.id,
    medications,
    verdict,
    generatedAt: new Date().toISOString(),
    isMock: true,
  }

  return delay(result, 700)
}
