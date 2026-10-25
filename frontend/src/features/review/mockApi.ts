import type { AssessmentResult, Medication, PatientProfile } from '../../types'
import { MOCK_MEDICATIONS } from './mocks/medications'
import { evaluateCombination } from './mocks/assessments'

/** Fixture-backed implementations, loaded only in mock mode (dynamic import from api.ts). */

const MOCK_LATENCY_MS = 450

function delay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export function fetchMockMedications(query = ''): Promise<Medication[]> {
  const filtered = query
    ? MOCK_MEDICATIONS.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
    : MOCK_MEDICATIONS
  return delay(filtered)
}

export async function runMockAssessment(
  patient: PatientProfile,
  medications: Medication[],
  options: { simulateError?: boolean } = {},
): Promise<AssessmentResult> {
  if (options.simulateError) {
    await delay(null, 700)
    throw new Error('ENGINE_TIMEOUT')
  }

  const medsById = new Map(MOCK_MEDICATIONS.map((m) => [m.id, m]))
  const medicationIds = medications.map((m) => m.id)
  const resolved = medicationIds.map((id) => {
    const med = medsById.get(id)
    if (!med) throw new Error(`Unknown medication id: ${id}`)
    return med
  })

  const verdict = evaluateCombination(patient, medicationIds, medsById)

  return delay(
    {
      patientId: patient.id,
      medications: resolved,
      verdict,
      generatedAt: new Date().toISOString(),
      isMock: true,
    },
    700,
  )
}
