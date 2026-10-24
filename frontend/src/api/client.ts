import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '../lib/config'
import type { ApiError } from '../types'

/**
 * Central API client. All backend calls go through here so there is a
 * single place to adjust base URL, headers, error shaping, and timeouts.
 */
export async function apiRequest<TResponse>(
  path: string,
  options: RequestInit = {},
): Promise<TResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

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

    return (await response.json()) as TResponse
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      const error: ApiError = {
        message: `Request to ${path} timed out after ${REQUEST_TIMEOUT_MS}ms`,
      }
      throw error
    }
    if (err instanceof TypeError) {
      const error: ApiError = {
        message: `Could not reach backend at ${API_BASE_URL}${path}. Is the service running?`,
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
