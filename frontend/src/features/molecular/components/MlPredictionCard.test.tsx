import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MlPredictionCard } from './MlPredictionCard'
import type { ModelInfo, MolecularAnalysisResponse } from '../../../types'

const baseResult: MolecularAnalysisResponse = {
  inputSmiles: 'CCO',
  canonicalSmiles: 'CCO',
  valid: true,
  neighbors: [],
  cyp2d6: { modelTrained: true, prediction: { predictedClass: 'non_inhibitor', rawScore: 0.12, scoreCalibrated: false } },
  provenance: { dataset: 'TDC CYP2D6_Veith', license: 'CC BY 4.0', method: 'x' },
  limitations: [],
}

const trainedModelInfo: ModelInfo = {
  trained: true,
  modelType: 'RandomForestClassifier',
  fingerprint: { type: 'morgan', radius: 2, nBits: 2048 },
  dataset: { name: 'TDC CYP2D6_Veith', license: 'CC BY 4.0', source: 'skfp' },
  metrics: {
    auprc: 0.7,
    rocAuc: 0.85,
    precision: 0.66,
    recall: 0.67,
    f1: 0.66,
    confusionMatrix: [
      [901, 104],
      [102, 206],
    ],
    positiveClassPrevalence: 0.23,
    nTrain: 100,
    nValidation: 10,
    nTest: 10,
    decisionThreshold: 0.425,
  },
  splitMethod: 'Bemis-Murcko scaffold split',
  randomSeed: 42,
}

describe('MlPredictionCard', () => {
  it('always renders the isolation notice when the model is trained', () => {
    render(<MlPredictionCard result={baseResult} modelInfo={trainedModelInfo} />)
    expect(screen.getByText(/isolated from the clinical assessment/i)).toBeInTheDocument()
  })

  it('always renders the isolation notice when the model is untrained', () => {
    const untrained: MolecularAnalysisResponse = { ...baseResult, cyp2d6: { modelTrained: false, prediction: undefined } }
    render(<MlPredictionCard result={untrained} modelInfo={null} />)
    expect(screen.getByText(/isolated from the clinical assessment/i)).toBeInTheDocument()
  })

  it('shows "Model not trained yet" with the training command and no score numbers when untrained', () => {
    const untrained: MolecularAnalysisResponse = { ...baseResult, cyp2d6: { modelTrained: false, prediction: undefined } }
    render(<MlPredictionCard result={untrained} modelInfo={null} />)
    expect(screen.getByText(/model not trained yet/i)).toBeInTheDocument()
    expect(screen.getByText(/train_cyp2d6_model\.py/)).toBeInTheDocument()
    expect(screen.queryByText('0.12')).not.toBeInTheDocument()
  })

  it('uses the uncalibrated score label and never says probability or confidence', () => {
    const { container } = render(<MlPredictionCard result={baseResult} modelInfo={trainedModelInfo} />)
    expect(screen.getByText(/raw model score \(uncalibrated\)/i)).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\bprobability\b/i)
    expect(container.textContent).not.toMatch(/\bconfidence\b/i)
    expect(container.textContent).not.toMatch(/within domain/i)
  })

  it('shows the heuristic low-similarity chip, not a "within domain" claim, when flagged', () => {
    const flagged: MolecularAnalysisResponse = {
      ...baseResult,
      cyp2d6: {
        modelTrained: true,
        prediction: {
          predictedClass: 'inhibitor',
          rawScore: 0.8,
          scoreCalibrated: false,
          applicabilityWarning: 'Low structural similarity to training compounds.',
        },
      },
    }
    render(<MlPredictionCard result={flagged} modelInfo={trainedModelInfo} />)
    expect(screen.getByText(/low similarity to training data \(heuristic, not a confidence interval\)/i)).toBeInTheDocument()
  })

  it('shows the training-set-membership chip when inTrainingSet is true', () => {
    render(<MlPredictionCard result={{ ...baseResult, inTrainingSet: true }} modelInfo={trainedModelInfo} />)
    expect(screen.getByText(/query is in the training data/i)).toBeInTheDocument()
  })

  it('does not show the training-set-membership chip when inTrainingSet is false', () => {
    render(<MlPredictionCard result={{ ...baseResult, inTrainingSet: false }} modelInfo={trainedModelInfo} />)
    expect(screen.queryByText(/query is in the training data/i)).not.toBeInTheDocument()
  })
})
