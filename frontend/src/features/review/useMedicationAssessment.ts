import { useCallback, useState } from 'react'
import type { AssessmentResult, Medication, PatientProfile, RequestState } from '../../types'
import { runAssessment } from './api'
import { ContractError } from '../../contracts/validate'

export function useMedicationAssessment() {
  const [state, setState] = useState<RequestState>('idle')
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [contractErrorPath, setContractErrorPath] = useState<string | null>(null)
  const [ranKey, setRanKey] = useState<string | null>(null)

  const submit = useCallback(
    async (patient: PatientProfile, medications: Medication[], options: { simulateError?: boolean } = {}) => {
      const medicationIds = medications.map((m) => m.id)
      if (medicationIds.length < 2) {
        setState('unsupported')
        setErrorMessage('Add at least two medications to run.')
        return
      }

      setState('loading')
      setErrorMessage(null)
      setContractErrorPath(null)
      try {
        const data = await runAssessment(patient, medications, options)
        setResult(data)
        setState('success')
        setRanKey(`${patient.id}|${medicationIds.join(',')}`)
      } catch (err) {
        if (err instanceof ContractError) {
          setState('contract_error')
          setErrorMessage(err.message)
          setContractErrorPath(err.path)
        } else {
          setState('error')
          setErrorMessage(err instanceof Error ? err.message : 'Assessment failed unexpectedly.')
        }
      }
    },
    [],
  )

  const reset = useCallback(() => {
    setState('idle')
    setResult(null)
    setErrorMessage(null)
    setContractErrorPath(null)
    setRanKey(null)
  }, [])

  return { state, result, errorMessage, contractErrorPath, ranKey, submit, reset }
}
