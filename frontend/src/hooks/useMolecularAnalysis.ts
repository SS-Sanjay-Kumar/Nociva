import { useCallback, useState } from 'react'
import type { MolecularAnalysisResponse, RequestState } from '../types'
import { analyzeMolecule } from '../api/molecularApi'
import { isApiError } from '../api/client'

export function useMolecularAnalysis() {
  const [state, setState] = useState<RequestState>('idle')
  const [result, setResult] = useState<MolecularAnalysisResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const analyze = useCallback(async (smiles: string) => {
    const trimmed = smiles.trim()
    if (!trimmed) {
      setState('unsupported')
      setErrorMessage('Enter a SMILES string to analyze.')
      return
    }
    if (trimmed.length > 500) {
      setState('unsupported')
      setErrorMessage('Input is too long to be a valid SMILES string (max 500 characters).')
      return
    }

    setState('loading')
    setErrorMessage(null)
    try {
      const data = await analyzeMolecule(trimmed)
      setResult(data)
      setState(data.valid ? 'success' : 'unsupported')
    } catch (err) {
      setState('error')
      if (isApiError(err)) {
        setErrorMessage(err.detail ?? err.message)
      } else {
        setErrorMessage('Molecular analysis service is unavailable.')
      }
    }
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setResult(null)
    setErrorMessage(null)
  }, [])

  return { state, result, errorMessage, analyze, reset }
}
