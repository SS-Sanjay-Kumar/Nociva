import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { expectNoA11yViolations } from '../../testing/a11y'
import { ExperimentalBanner } from './components/ExperimentalBanner'
import { SmilesInputCard } from './components/SmilesInputCard'
import { QueryStructureCard } from './components/QueryStructureCard'
import { NeighboursCard } from './components/NeighboursCard'
import { MlPredictionCard } from './components/MlPredictionCard'
import { LimitationsCard } from './components/LimitationsCard'
import { InvalidSmilesPane } from './components/InvalidSmilesPane'
import { ServiceUnavailablePane } from './components/ServiceUnavailablePane'
import type { ModelInfo, MolecularAnalysisResponse } from '../../types'

const result: MolecularAnalysisResponse = {
  inputSmiles: 'CC(=O)Oc1ccccc1C(=O)O',
  canonicalSmiles: 'CC(=O)Oc1ccccc1C(=O)O',
  valid: true,
  molecularFormula: 'C9H8O4',
  molecularWeight: 180.16,
  neighbors: [
    { identifier: 'CYP2D6_Veith_train#4107', smiles: 'x', canonicalSmiles: 'CC(=O)Oc1ccccc1C(=O)Oc1ccccc1C(=O)O', tanimotoSimilarity: 0.857 },
  ],
  maxSimilarity: 0.857,
  inTrainingSet: false,
  cyp2d6: {
    modelTrained: true,
    prediction: { predictedClass: 'non_inhibitor', rawScore: 0.017, scoreCalibrated: false, applicabilityWarning: null },
  },
  provenance: {
    dataset: 'TDC CYP2D6_Veith',
    license: 'CC BY 4.0',
    method: 'Morgan fingerprints (radius=2, 2048 bits) + Tanimoto similarity',
    fingerprint: { type: 'morgan', radius: 2, nBits: 2048 },
    referenceSetSize: 10504,
    reportingThreshold: 0.3,
  },
  limitations: ['Predicts an experimental in-vitro CYP2D6 inhibition assay label.'],
  error: null,
}

const modelInfo: ModelInfo = {
  trained: true,
  modelType: 'RandomForestClassifier',
  nEstimators: 120,
  fingerprint: { type: 'morgan', radius: 2, nBits: 2048 },
  dataset: { name: 'TDC CYP2D6_Veith', license: 'CC BY 4.0', source: 'skfp' },
  metrics: {
    auprc: 0.704,
    rocAuc: 0.852,
    precision: 0.665,
    recall: 0.669,
    f1: 0.667,
    confusionMatrix: [[901, 104], [102, 206]],
    positiveClassPrevalence: 0.235,
    nTrain: 10504,
    nValidation: 1313,
    nTest: 1313,
    decisionThreshold: 0.425,
  },
  splitMethod: 'Bemis-Murcko scaffold split (80/10/10)',
  randomSeed: 42,
}

function IdleComposition() {
  return (
    <div>
      <ExperimentalBanner />
      <SmilesInputCard value="" onChange={() => {}} onAnalyze={() => {}} onPickExample={() => {}} onClear={() => {}} loading={false} valid={false} />
      <QueryStructureCard result={null} isTrueIdle />
    </div>
  )
}

function SuccessComposition() {
  return (
    <div>
      <NeighboursCard result={result} />
      <MlPredictionCard result={result} modelInfo={modelInfo} />
      <LimitationsCard limitations={result.limitations} />
    </div>
  )
}

describe('Molecular Explorer accessibility (axe)', () => {
  it('idle state has no violations', async () => {
    const { container } = render(<IdleComposition />)
    await expectNoA11yViolations(container)
  })

  it('success state has no violations', async () => {
    const { container } = render(<SuccessComposition />)
    await expectNoA11yViolations(container)
  })

  it('invalid SMILES state has no violations', async () => {
    const { container } = render(<InvalidSmilesPane message="Input is not a valid SMILES string that RDKit can parse." />)
    await expectNoA11yViolations(container)
  })

  it('backend-unavailable state has no violations', async () => {
    const { container } = render(<ServiceUnavailablePane message="Could not reach backend at http://localhost:8000." />)
    await expectNoA11yViolations(container)
  })
})
