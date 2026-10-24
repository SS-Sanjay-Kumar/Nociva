import type { AssessmentResult, Medication, PatientProfile } from '../types'
import { MOCK_PATIENTS } from '../mocks/patients'
import { MOCK_MEDICATIONS } from '../mocks/medications'
import { getMockAssessment } from '../mocks/assessments'
import { MEDICATION_REVIEW_MOCK_MODE } from '../lib/config'

/**
 * Medication Review API adapter.
 *
 * MEDICATION_REVIEW_MOCK_MODE is currently always true: the teammate's
 * deterministic rule-engine backend contract is not yet available. All
 * functions here simulate network latency and return data clearly labelled
 * as mock fixtures (AssessmentResult.isMock === true).
 *
 * When the backend contract lands, replace the bodies below with
 * apiRequest<T>() calls per INTEGRATION.md, without changing call sites.
 */

const MOCK_LATENCY_MS = 450

function delay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export async function fetchPatients(): Promise<PatientProfile[]> {
  if (MEDICATION_REVIEW_MOCK_MODE) {
    return delay(MOCK_PATIENTS)
  }
  throw new Error('Live Medication Review backend not yet integrated.')
}

export async function fetchMedications(query = ''): Promise<Medication[]> {
  if (MEDICATION_REVIEW_MOCK_MODE) {
    const filtered = query
      ? MOCK_MEDICATIONS.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
      : MOCK_MEDICATIONS
    return delay(filtered)
  }
  throw new Error('Live Medication Review backend not yet integrated.')
}

export async function runAssessment(
  patient: PatientProfile,
  medicationIds: string[],
): Promise<AssessmentResult[]> {
  if (!MEDICATION_REVIEW_MOCK_MODE) {
    throw new Error('Live Medication Review backend not yet integrated.')
  }

  const cyp2d6 = patient.genotypes.find((g) => g.gene === 'CYP2D6')

  const results: AssessmentResult[] = medicationIds.map((medicationId) => {
    const medication = MOCK_MEDICATIONS.find((m) => m.id === medicationId)
    if (!medication) {
      throw new Error(`Unknown medication id: ${medicationId}`)
    }
    const mockResult = getMockAssessment(patient.id, medicationId, cyp2d6?.phenotype)
    return { ...mockResult, medication }
  })

  return delay(results, 700)
}
