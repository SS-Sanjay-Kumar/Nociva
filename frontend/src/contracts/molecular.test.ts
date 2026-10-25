import { describe, expect, it } from 'vitest'
import { MolecularAnalysisResponseSchema } from './molecular'
import { parseWithSchema, ContractError } from './validate'

const VALID: unknown = {
  inputSmiles: 'CCO',
  canonicalSmiles: 'CCO',
  valid: true,
  neighbors: [
    { identifier: 'CYP2D6_Veith_train#0', smiles: 'CCO', canonicalSmiles: 'CCO', tanimotoSimilarity: 1.0 },
  ],
  cyp2d6: {
    modelTrained: true,
    prediction: { predictedClass: 'non_inhibitor', rawScore: 0.1, scoreCalibrated: false },
  },
  provenance: { dataset: 'TDC CYP2D6_Veith', license: 'CC BY 4.0', method: 'x' },
  limitations: [],
}

describe('MolecularAnalysisResponseSchema', () => {
  it('accepts a valid response', () => {
    expect(() => parseWithSchema(MolecularAnalysisResponseSchema, VALID, 'test')).not.toThrow()
  })

  it('rejects a response missing a required field (cyp2d6)', () => {
    const bad = structuredClone(VALID) as any
    delete bad.cyp2d6
    expect(() => parseWithSchema(MolecularAnalysisResponseSchema, bad, 'test')).toThrow(ContractError)
    try {
      parseWithSchema(MolecularAnalysisResponseSchema, bad, 'test')
    } catch (err) {
      expect((err as ContractError).path).toContain('cyp2d6')
    }
  })

  it('rejects a wrong enum value for predictedClass', () => {
    const bad = structuredClone(VALID) as any
    bad.cyp2d6.prediction.predictedClass = 'maybe'
    expect(() => parseWithSchema(MolecularAnalysisResponseSchema, bad, 'test')).toThrow(ContractError)
    try {
      parseWithSchema(MolecularAnalysisResponseSchema, bad, 'test')
    } catch (err) {
      expect((err as ContractError).path).toContain('predictedClass')
    }
  })

  it('allows extra unknown fields without failing', () => {
    const withExtra = { ...structuredClone(VALID) as any, somethingNew: 42 }
    const parsed = parseWithSchema(MolecularAnalysisResponseSchema, withExtra, 'test')
    expect(parsed).not.toHaveProperty('somethingNew')
  })
})
