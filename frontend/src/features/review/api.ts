import type { AssessmentResult, GeneInfo, Medication, PatientProfile } from '../../types'
import { MOCK_PATIENTS } from './mocks/patients'
import { MEDICATION_REVIEW_MOCK_MODE } from '../../lib/config'
import { fetchLiveGenes, fetchLiveMedications, runLiveAssessment } from './liveApi'

/**
 * Medication Review API adapter, switched by VITE_REVIEW_MODE (lib/config.ts).
 *
 * - "mock" (default): fixture medications and a fixture evaluator, loaded
 *   lazily so the live path never pulls them in. Results carry isMock: true.
 * - "live": GET /api/v1/review/medications and POST /api/v1/review/assess via
 *   the central contract-validated client (liveApi.ts). No mock fallback.
 *
 * Patients are always synthetic frontend data; no patient endpoint exists.
 */

export async function fetchPatients(): Promise<PatientProfile[]> {
  return MOCK_PATIENTS
}

export async function fetchMedications(query = '', signal?: AbortSignal): Promise<Medication[]> {
  if (MEDICATION_REVIEW_MOCK_MODE) {
    const { fetchMockMedications } = await import('./mockApi')
    return fetchMockMedications(query)
  }
  return fetchLiveMedications(query, signal)
}

/** Live only: supported genes backed by guideline rows. Mock mode never edits profiles, so it never asks. */
export async function fetchGenes(): Promise<GeneInfo[]> {
  return fetchLiveGenes()
}

/** Runs one assessment for the whole selected medication list. */
export async function runAssessment(
  patient: PatientProfile,
  medications: Medication[],
  options: { simulateError?: boolean } = {},
): Promise<AssessmentResult> {
  if (MEDICATION_REVIEW_MOCK_MODE) {
    const { runMockAssessment } = await import('./mockApi')
    return runMockAssessment(patient, medications, options)
  }
  return runLiveAssessment(patient, medications)
}
