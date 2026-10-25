import type { ZodType } from 'zod'
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../lib/config'
import type { ApiError } from '../types'
import { parseWithSchema } from '../contracts/validate'

/**
 * Central API client. All backend calls go through here so there is a
 * single place to adjust base URL, headers, error shaping, timeouts, and
 * runtime contract validation. Pass `schema` to validate the response at
 * this one boundary — every caller gets the same ContractError behaviour
 * for free instead of each feature re-implementing it.
 */
export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {},
  schema?: ZodType<TResponse>,
): Promise<TResponse> {
  const controller = new AbortController()
  let timedOut = false
  const timeout = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT_MS)
  // A caller-supplied signal (e.g. a stale search) aborts this request too.
  const callerSignal = options.signal
  if (callerSignal) {
    if (callerSignal.aborted) controller.abort()
    else callerSignal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      let detail: string | undefined
      try {
        const body = await response.json()
        detail = body?.detail ?? JSON.stringify(body)
      } catch {
        detail = await response.text().catch(() => undefined)
      }
      const error: ApiError = {
        message: `Request to ${path} failed with status ${response.status}`,
        detail,
        status: response.status,
      }
      throw error
    }

    const data: unknown = await response.json()
    return schema ? parseWithSchema(schema, data, path) : (data as TResponse)
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (!timedOut) throw err // aborted by the caller, not a timeout
      const error: ApiError = {
        message: `Request to ${path} timed out after ${REQUEST_TIMEOUT_MS}ms`,
      }
      throw error
    }
    if (err instanceof TypeError) {
      const error: ApiError = {
        message: `Could not reach backend at ${API_BASE_URL}${path}. Is the service running?`,
        network: true,
      }
      throw error
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}

export function isApiError(err: unknown): err is ApiError {
  return typeof err === 'object' && err !== null && 'message' in err
}
