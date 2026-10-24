import { describe, expect, it } from 'vitest'
import { AssessmentResultSchema } from './review'
import { parseWithSchema, ContractError } from './validate'
import { MOCK_PATIENTS } from '../features/review/mocks/patients'
import { MOCK_MEDICATIONS } from '../features/review/mocks/medications'
import { evaluateCombination } from '../features/review/mocks/assessments'
import { SCENARIOS } from '../features/review/mocks/scenarios'

const VALID: unknown = {
  patientId: 'patient-a',
  medications: [{ id: 'med-x', name: 'Drug X' }],
  verdict: {
    evidenceStatus: 'association_found',
    summary: 'Fixture summary.',
    references: [],
    limitations: [],
  },
  generatedAt: new Date().toISOString(),
  isMock: true,
}

describe('AssessmentResultSchema', () => {
  it('accepts a valid response', () => {
    expect(() => parseWithSchema(AssessmentResultSchema, VALID, 'test')).not.toThrow()
  })

  it('rejects a response missing a required field (verdict.summary)', () => {
    const bad = structuredClone(VALID) as any
    delete bad.verdict.summary
    expect(() => parseWithSchema(AssessmentResultSchema, bad, 'test')).toThrow(ContractError)
    try {
      parseWithSchema(AssessmentResultSchema, bad, 'test')
    } catch (err) {
      expect(err).toBeInstanceOf(ContractError)
      expect((err as ContractError).path).toContain('verdict.summary')
    }
  })

  it('rejects a wrong enum value for evidenceStatus', () => {
    const bad = structuredClone(VALID) as any
    bad.verdict.evidenceStatus = 'probably_fine'
    expect(() => parseWithSchema(AssessmentResultSchema, bad, 'test')).toThrow(ContractError)
    try {
      parseWithSchema(AssessmentResultSchema, bad, 'test')
    } catch (err) {
      expect((err as ContractError).path).toContain('verdict.evidenceStatus')
    }
  })

  it('allows extra unknown fields without failing', () => {
    const withExtra = { ...structuredClone(VALID) as any, somethingTheBackendAddedLater: 'ignore me' }
    const parsed = parseWithSchema(AssessmentResultSchema, withExtra, 'test')
    expect(parsed).not.toHaveProperty('somethingTheBackendAddedLater')
  })
})

describe('docs/contracts/examples/*.json validate against the schema', () => {
  const examples = import.meta.glob('../../../docs/contracts/examples/*.json', { eager: true }) as Record<
    string,
    { default: unknown }
  >
  const entries = Object.entries(examples).map(([file, mod]) => [file, mod.default] as const)

  it('found at least the three verdict examples', () => {
    expect(entries.length).toBeGreaterThanOrEqual(3)
  })

  it.each(entries)('%s matches AssessmentResultSchema', (file, data) => {
    expect(() => parseWithSchema(AssessmentResultSchema, data, file)).not.toThrow()
  })
})

describe('mock fixtures validate against the schema', () => {
  const medsById = new Map(MOCK_MEDICATIONS.map((m) => [m.id, m]))

  it.each(SCENARIOS)('scenario $id produces a schema-valid AssessmentResult', (scenario) => {
    const patient = MOCK_PATIENTS.find((p) => p.id === scenario.patientId)!
    const verdict = evaluateCombination(patient, scenario.medicationIds, medsById)
    const result = {
      patientId: patient.id,
      medications: scenario.medicationIds.map((id) => medsById.get(id)!),
      verdict,
      generatedAt: new Date().toISOString(),
      isMock: true,
    }
    expect(() => parseWithSchema(AssessmentResultSchema, result, scenario.id)).not.toThrow()
  })
})
