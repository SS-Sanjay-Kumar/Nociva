import { describe, expect, it } from 'vitest'
import { PkPresetListSchema, SimulateResponseSchema } from './pk'
import { ContractError, parseWithSchema } from './validate'
import plain from '../../../docs/contracts/pk-examples/synthetic-x.response.json'
import withMc from '../../../docs/contracts/pk-examples/synthetic-x-montecarlo.response.json'
import presets from '../../../docs/contracts/pk-examples/presets.json'

describe('PK contract', () => {
  it('parses the backend examples (with and without Monte Carlo)', () => {
    const a = parseWithSchema(SimulateResponseSchema, plain, '/api/pk/simulate')
    expect(a.altered?.hypothetical).toBe(true)
    expect(a.monteCarlo).toBeUndefined()
    const b = parseWithSchema(SimulateResponseSchema, withMc, '/api/pk/simulate')
    expect(b.monteCarlo?.baseline.concentrationBands.p5.length).toBe(b.timeHours.length)
  })

  it('parses the presets list', () => {
    expect(PkPresetListSchema.parse(presets)).toHaveLength(3)
  })

  it('rejects a broken response with the failing path', () => {
    const broken = { ...plain, baseline: { ...plain.baseline, metrics: { cmaxMgPerL: 'high' } } }
    try {
      parseWithSchema(SimulateResponseSchema, broken, '/api/pk/simulate')
      expect.unreachable()
    } catch (e) {
      expect(e).toBeInstanceOf(ContractError)
      expect((e as ContractError).path).toMatch(/^baseline\.metrics\./)
    }
  })

  it('rejects a response missing the time axis', () => {
    const { timeHours: _t, ...rest } = plain
    expect(() => parseWithSchema(SimulateResponseSchema, rest, '/x')).toThrow(ContractError)
  })
})
