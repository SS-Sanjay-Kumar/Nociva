import { apiRequest, isApiError } from '../../api/client'
import { PkPresetListSchema, SimulateResponseSchema } from '../../contracts/pk'
import type { PkPreset, SimulateRequest, SimulateResponse } from '../../contracts/pk'

export const PK_SERVICE_DOWN_MESSAGE = 'PK service is not running'

function plain(err: unknown): unknown {
  if (isApiError(err) && err.network) return { ...err, message: PK_SERVICE_DOWN_MESSAGE }
  return err
}

export async function fetchPresets(): Promise<PkPreset[]> {
  try {
    return await apiRequest<PkPreset[]>('/api/pk/presets', {}, PkPresetListSchema)
  } catch (err) {
    throw plain(err)
  }
}

export async function simulate(request: SimulateRequest): Promise<SimulateResponse> {
  try {
    return await apiRequest<SimulateResponse>(
      '/api/pk/simulate',
      { method: 'POST', body: JSON.stringify(request) },
      SimulateResponseSchema,
    )
  } catch (err) {
    throw plain(err)
  }
}
