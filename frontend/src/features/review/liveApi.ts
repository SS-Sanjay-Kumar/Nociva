import type { AssessmentResult, Medication, PatientProfile } from '../../types'
import { apiRequest, isApiError } from '../../api/client'
import { AssessmentResultSchema, MedicationListSchema } from '../../contracts/review'

/**
 * Live Medication Review adapter: GET /api/v1/review/medications and
 * POST /api/v1/review/assess. This module must never import the mock
 * fixtures or evaluators (enforced by liveApi.test.ts) and never falls
 * back to them: a failure is surfaced, not papered over.
 */

export const SERVICE_DOWN_MESSAGE = 'Review service is not running'

export interface AssessGenotype {
  gene: string
  phenotype: string
  diplotype?: string
  activityScore?: number
}

export interface AssessRequestBody {
  patientId: string
  genotypes: AssessGenotype[]
  medications: { id: string; name: string }[]
}

/** Only genes with a real result are sent. A missing gene is omitted, never defaulted. */
export function toAssessRequest(patient: PatientProfile, medications: Medication[]): AssessRequestBody {
  const genotypes: AssessGenotype[] = []
  for (const g of patient.genotypes) {
    if (g.missing || !g.phenotype) continue
    genotypes.push({
      gene: g.gene,
      phenotype: g.phenotype,
      ...(g.diplotype ? { diplotype: g.diplotype } : {}),
      ...(g.activityScore !== undefined ? { activityScore: g.activityScore } : {}),
    })
  }
  return {
    patientId: patient.id,
    genotypes,
    medications: medications.map((m) => ({ id: m.id, name: m.name })),
  }
}

export function titleCase(name: string): string {
  return name.replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Live medication ids are the lowercase generic name. */
export function liveMedication(name: string): Medication {
  return { id: name.toLowerCase(), name: titleCase(name.toLowerCase()) }
}

function plainNetworkError(err: unknown): unknown {
  if (isApiError(err) && err.network) return { ...err, message: SERVICE_DOWN_MESSAGE }
  return err
}

export async function fetchLiveMedications(query = '', signal?: AbortSignal): Promise<Medication[]> {
  try {
    return await apiRequest<Medication[]>(
      `/api/v1/review/medications?query=${encodeURIComponent(query)}`,
      { signal },
      MedicationListSchema,
    )
  } catch (err) {
    throw plainNetworkError(err)
  }
}

export async function runLiveAssessment(patient: PatientProfile, medications: Medication[]): Promise<AssessmentResult> {
  try {
    return await apiRequest<AssessmentResult>(
      '/api/v1/review/assess',
      { method: 'POST', body: JSON.stringify(toAssessRequest(patient, medications)) },
      AssessmentResultSchema,
    )
  } catch (err) {
    throw plainNetworkError(err)
  }
}
