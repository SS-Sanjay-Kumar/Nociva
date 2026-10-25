import { useCallback, useState } from 'react'
import type { SimulateRequest, SimulateResponse } from '../../contracts/pk'
import { ContractError } from '../../contracts/validate'
import { simulate } from './api'

export type SimState = 'idle' | 'loading' | 'success' | 'error' | 'contract_error'

export function useSimulation() {
  const [state, setState] = useState<SimState>('idle')
  const [result, setResult] = useState<SimulateResponse | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [contractPath, setContractPath] = useState<string | null>(null)

  const run = useCallback(async (request: SimulateRequest) => {
    setState('loading')
    setMessage(null)
    setContractPath(null)
    try {
      const data = await simulate(request)
      setResult(data)
      setState('success')
    } catch (err) {
      setResult(null) // never keep curves from a previous run after a failure
      if (err instanceof ContractError) {
        setState('contract_error')
        setMessage(err.message)
        setContractPath(err.path)
      } else {
        setState('error')
        setMessage(err instanceof Error ? err.message : ((err as { message?: string })?.message ?? 'Simulation failed'))
      }
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setResult(null)
    setMessage(null)
    setContractPath(null)
  }, [])

  return { state, result, message, contractPath, run, reset }
}
