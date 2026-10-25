import { useEffect, useState } from 'react'
import type { ModelInfo } from '../../types'
import { useMolecularAnalysis } from './useMolecularAnalysis'
import { fetchModelInfo } from './api'
import { ExperimentalBanner } from './components/ExperimentalBanner'
import { SmilesInputCard } from './components/SmilesInputCard'
import { QueryStructureCard } from './components/QueryStructureCard'
import { NeighboursCard } from './components/NeighboursCard'
import { MlPredictionCard } from './components/MlPredictionCard'
import { LimitationsCard } from './components/LimitationsCard'
import { InvalidSmilesPane } from './components/InvalidSmilesPane'
import { ServiceUnavailablePane } from './components/ServiceUnavailablePane'
import { Skeleton } from '../../components/ui/Misc'
import { ContractErrorPane } from '../../components/ui/ContractErrorPane'
import { Footer } from '../../components/shell/Footer'

const DEFAULT_SMILES = 'CNCCC(c1ccccc1)Oc1ccc(cc1)C(F)(F)F'

export function ExplorerPage() {
  const [text, setText] = useState('')
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [modelInfoUnavailable, setModelInfoUnavailable] = useState(false)
  const { state, result, errorMessage, contractErrorPath, analyze, reset } = useMolecularAnalysis()

  useEffect(() => {
    fetchModelInfo()
      .then(setModelInfo)
      .catch(() => setModelInfoUnavailable(true))
  }, [])

  const run = (smiles: string) => {
    setText(smiles)
    analyze(smiles)
  }

  useEffect(() => {
    run(DEFAULT_SMILES)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fieldError = state === 'unsupported' ? (errorMessage ?? result?.error ?? undefined) : undefined

  let right: React.ReactNode = null
  if (state === 'loading') {
    right = (
      <div className="flex flex-col gap-4">
        <Skeleton height={300} />
        <Skeleton height={260} dashed />
      </div>
    )
  } else if (state === 'contract_error') {
    right = <ContractErrorPane path={contractErrorPath ?? '(root)'} message={errorMessage ?? 'Response did not match the expected shape.'} />
  } else if (state === 'error') {
    right = <ServiceUnavailablePane message={errorMessage ?? 'The molecular analysis service did not respond.'} />
  } else if (state === 'unsupported') {
    right = <InvalidSmilesPane message={errorMessage ?? result?.error ?? 'Invalid input.'} />
  } else if (state === 'success' && result) {
    right = (
      <div className="flex flex-col gap-4">
        <NeighboursCard result={result} />
        <MlPredictionCard result={result} modelInfo={modelInfo} />
        <LimitationsCard limitations={result.limitations} />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1380px] flex-col gap-5 px-4 py-6 min-[721px]:px-6">
      <div>
        <h1 className="font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] min-[721px]:text-[26px]">
          Molecular explorer
        </h1>
        <p className="mt-1 max-w-[62ch] text-ink-2">
          Find structurally similar compounds and get an experimental CYP2D6 inhibition prediction for a
          molecule.
        </p>
      </div>

      <ExperimentalBanner />

      {modelInfoUnavailable && state === 'idle' && (
        <ServiceUnavailablePane message="Could not reach the local molecular API to load model info." />
      )}

      <div className="grid grid-cols-1 items-start gap-5 min-[901px]:grid-cols-[minmax(310px,380px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <SmilesInputCard
            value={text}
            onChange={setText}
            onAnalyze={() => run(text)}
            onPickExample={run}
            onClear={() => {
              setText('')
              reset()
            }}
            loading={state === 'loading'}
            fieldError={fieldError}
            valid={state === 'success'}
          />
          <QueryStructureCard
            result={state === 'success' ? result : null}
            isTrueIdle={state === 'idle' && text.trim().length === 0}
          />
        </div>
        <div className="min-w-0">{right}</div>
      </div>

      <Footer />
    </div>
  )
}
