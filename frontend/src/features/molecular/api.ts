import { apiRequest } from '../../api/client'
import type { MolecularAnalysisResponse, ModelInfo } from '../../types'

/**
 * Molecular Intelligence Engine API adapter (Stream 1).
 * Talks to the local FastAPI service at POST /api/molecular/analyze and
 * GET /api/molecular/model-info. Real backend integration, not a mock —
 * callers get a thrown ApiError if the local service is unavailable.
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
