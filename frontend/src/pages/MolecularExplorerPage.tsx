import { useEffect, useState } from 'react'
import { FlaskConical, Search } from 'lucide-react'
import { useMolecularAnalysis } from '../hooks/useMolecularAnalysis'
import { fetchModelInfo } from '../api/molecularApi'
import type { ModelInfo } from '../types'
import { SimilarityNeighborsList } from '../components/SimilarityNeighborsList'
import { ClassifierResultCard } from '../components/ClassifierResultCard'
import { ModelMetricsPanel } from '../components/ModelMetricsPanel'
import { LoadingState, ErrorState, UnsupportedState } from '../components/StatusStates'
import { DisclaimerBanner } from '../components/DisclaimerBanner'

const EXAMPLE_SMILES = [
  { label: 'Codeine', smiles: 'CN1CCC23c4c5ccc(O)c4OC2C(O)C=CC3C1C5' },
  { label: 'Fluoxetine', smiles: 'CNCCC(Oc1ccc(cc1)C(F)(F)F)c1ccccc1' },
  { label: 'Aspirin', smiles: 'CC(=O)Oc1ccccc1C(=O)O' },
  { label: 'Invalid example', smiles: 'this-is-not-a-smiles(((' },
]

export function MolecularExplorerPage() {
  const [input, setInput] = useState('')
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const [modelInfoError, setModelInfoError] = useState<string | null>(null)
  const { state, result, errorMessage, analyze } = useMolecularAnalysis()

  useEffect(() => {
    fetchModelInfo()
      .then(setModelInfo)
      .catch(() => setModelInfoError('Local molecular API is unavailable — start the backend to see model info.'))
  }, [])

  const handleAnalyze = (smiles: string) => {
    setInput(smiles)
    analyze(smiles)
  }

  return (
    <div className="space-y-6">
      <DisclaimerBanner>
        <strong>Experimental research tool.</strong> Molecular similarity and the CYP2D6 classifier
        predict an in-vitro experimental assay label on a locally-trained model. Neither establishes a
        clinically important interaction, and neither feeds into the deterministic clinical verdict used
        in Medication Review.
      </DisclaimerBanner>

      <div>
        <h2 className="text-sm font-semibold text-slate-600 mb-2">Enter a SMILES string</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. CC(=O)Oc1ccccc1C(=O)O"
            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="button"
            onClick={() => handleAnalyze(input)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700"
          >
            <Search size={16} /> Analyze
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {EXAMPLE_SMILES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => handleAnalyze(ex.smiles)}
              className="text-xs rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:border-indigo-300"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {state === 'loading' && <LoadingState label="Validating structure and running local inference…" />}
      {state === 'error' && errorMessage && <ErrorState message={errorMessage} />}
      {state === 'unsupported' && (errorMessage || result?.error) && (
        <UnsupportedState message={errorMessage ?? result?.error ?? 'Invalid input.'} />
      )}

      {result && result.valid && (
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
            <span className="text-slate-500">Canonical SMILES: </span>
            <span className="font-mono text-slate-800">{result.canonicalSmiles}</span>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Top 5 nearest reference compounds</h3>
            <SimilarityNeighborsList neighbors={result.neighbors} />
          </div>

          <ClassifierResultCard cyp2d6={result.cyp2d6} />

          <p className="text-xs text-slate-400">
            Method: {result.provenance.method} · Dataset: {result.provenance.dataset} (
            {result.provenance.license})
          </p>
        </div>
      )}

      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-2">
          <FlaskConical size={15} /> Model evaluation
        </h3>
        {modelInfoError ? <ErrorState message={modelInfoError} /> : <ModelMetricsPanel modelInfo={modelInfo} />}
      </div>
    </div>
  )
}
