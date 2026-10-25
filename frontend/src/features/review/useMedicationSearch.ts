import { useCallback, useEffect, useRef, useState } from 'react'
import type { Medication } from '../../types'
import { fetchMedications } from './api'

export const SEARCH_DEBOUNCE_MS = 250

/** Debounced medication search; a newer query aborts the in-flight older one. */
export function useMedicationSearch(initial: Medication[]) {
  const [results, setResults] = useState<Medication[]>(initial)
  const [error, setError] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const controller = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    clearTimeout(timer.current)
    controller.current?.abort()
  }, [])

  useEffect(() => cancel, [cancel])

  const search = useCallback(
    (query: string, onResults?: (meds: Medication[]) => void) => {
      cancel()
      timer.current = setTimeout(() => {
        const ctl = new AbortController()
        controller.current = ctl
        fetchMedications(query.trim(), ctl.signal)
          .then((meds) => {
            if (ctl.signal.aborted) return
            setError(null)
            setResults(meds)
            onResults?.(meds)
          })
          .catch((err) => {
            if (ctl.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return
            setError(err instanceof Error ? err.message : (err?.message ?? 'Medication search failed'))
          })
      }, SEARCH_DEBOUNCE_MS)
    },
    [cancel],
  )

  return { results, setResults, error, search }
}
