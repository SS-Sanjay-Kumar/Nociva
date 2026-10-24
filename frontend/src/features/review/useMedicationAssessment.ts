import { useCallback, useState } from 'react'
import type { AssessmentResult, PatientProfile, RequestState } from '../../types'
import { runAssessment } from './api'

export function useMedicationAssessment() {
  const [state, setState] = useState<RequestState>('idle')
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [ranKey, setRanKey] = useState<string | null>(null)

  const submit = useCallback(
    async (patient: PatientProfile, medicationIds: string[], options: { simulateError?: boolean } = {}) => {
      if (medicationIds.length < 2) {
        setState('unsupported')
        setErrorMessage('Add at least two medications to run.')
        return
      }

      setState('loading')
      setErrorMessage(null)
      try {
        const data = await runAssessment(patient, medicationIds, options)
        setResult(data)
        setState('success')
        setRanKey(`${patient.id}|${medicationIds.join(',')}`)
      } catch (err) {
        setState('error')
        setErrorMessage(err instanceof Error ? err.message : 'Assessment failed unexpectedly.')
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setState('idle')
    setResult(null)
    setErrorMessage(null)
    setRanKey(null)
  }, [])

  return { state, result, errorMessage, ranKey, submit, reset }
}
