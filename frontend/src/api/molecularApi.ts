import { apiRequest } from './client'
import type { MolecularAnalysisResponse, ModelInfo } from '../types'

/**
 * Molecular Intelligence Engine API adapter (Stream 1).
 * Talks to the local FastAPI service at POST /api/molecular/analyze and
 * GET /api/molecular/model-info. This is a real backend integration, not
 * a mock — if the local service is unavailable, callers get a thrown
 * ApiError which the UI renders as a service-unavailable state.
 */

export async function analyzeMolecule(smiles: string): Promise<MolecularAnalysisResponse> {
  return apiRequest<MolecularAnalysisResponse>('/api/molecular/analyze', {
    method: 'POST',
    body: JSON.stringify({ smiles }),
  })
}

export async function fetchModelInfo(): Promise<ModelInfo> {
  return apiRequest<ModelInfo>('/api/molecular/model-info')
}

export async function checkHealth(): Promise<{ status: string }> {
  return apiRequest<{ status: string }>('/health')
}
