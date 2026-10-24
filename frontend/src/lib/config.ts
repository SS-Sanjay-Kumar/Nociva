/**
 * Central runtime configuration.
 *
 * MOCK MODE: Medication Review's mode is controlled by VITE_REVIEW_MODE
 * ("mock" | "live"), defaulting to "mock" — clearly-labelled demonstration
 * fixtures instead of a backend call. Set VITE_REVIEW_MODE=live once the
 * real deterministic rule-engine backend exists (see INTEGRATION.md §3);
 * live mode calls the central API client exactly like Molecular Explorer
 * already does.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export type ReviewMode = 'mock' | 'live'

function resolveReviewMode(): ReviewMode {
  const raw = import.meta.env.VITE_REVIEW_MODE
  return raw === 'live' ? 'live' : 'mock'
}

export const REVIEW_MODE: ReviewMode = resolveReviewMode()

/** Derived from REVIEW_MODE — kept as a boolean export since most call sites just need a yes/no. */
export const MEDICATION_REVIEW_MOCK_MODE = REVIEW_MODE === 'mock'

export const REQUEST_TIMEOUT_MS = 10_000
