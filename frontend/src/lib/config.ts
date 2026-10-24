/**
 * Central runtime configuration.
 *
 * MOCK MODE: When VITE_API_BASE_URL is unset, or VITE_FORCE_MOCK=true, the
 * Medication Review module serves clearly-labelled demonstration fixtures
 * instead of calling a backend. This lets frontend work proceed without
 * blocking on backend availability, per project requirements.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export const FORCE_MOCK = import.meta.env.VITE_FORCE_MOCK === 'true'

/** Medication Review currently has no live backend contract -> always mock. */
export const MEDICATION_REVIEW_MOCK_MODE = true

export const REQUEST_TIMEOUT_MS = 10_000
