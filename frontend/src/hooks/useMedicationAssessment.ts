import { useCallback, useState } from 'react'
import type { AssessmentResult, PatientProfile, RequestState } from '../types'
import { runAssessment } from '../api/medicationApi'

export function useMedicationAssessment() {
  const [state, setState] = useState<RequestState>('idle')
  const [results, setResults] = useState<AssessmentResult[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const submit = useCallback(async (patient: PatientProfile, medicationIds: string[]) => {
    if (medicationIds.length === 0) {
      setState('unsupported')
      setErrorMessage('Select at least one medication before running an assessment.')
      return
    }

    setState('loading')
    setErrorMessage(null)
    try {
      const data = await runAssessment(patient, medicationIds)
      setResults(data)
      setState('success')
    } catch (err) {
      setState('error')
      setErrorMessage(err instanceof Error ? err.message : 'Assessment failed unexpectedly.')
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setResults([])
    setErrorMessage(null)
  }, [])

  return { state, results, errorMessage, submit, reset }
}
