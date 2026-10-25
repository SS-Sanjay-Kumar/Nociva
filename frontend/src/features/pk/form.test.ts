import { describe, expect, it } from 'vitest'
import { applyPatch, buildRequest, presetToForm, validateForm } from './form'
import presets from '../../../../docs/contracts/pk-examples/presets.json'
import { PkPresetListSchema } from '../../contracts/pk'

const preset = PkPresetListSchema.parse(presets)[0]
const base = presetToForm(preset)

describe('PK form validation (same bounds as the backend)', () => {
  it('accepts the Synthetic Compound X preset', () => {
    expect(validateForm(base)).toEqual({})
  })

  it.each([
    ['doseMg', '-1', /Dose must be/],
    ['doseMg', '10001', /Dose must be/],
    ['doseMg', '', /Dose must be/],
    ['bioavailability', '0', /greater than 0 and at most 1/],
    ['bioavailability', '1.2', /greater than 0 and at most 1/],
    ['volumeL', '0', /Volume must be a number greater than 0/],
    ['clearanceLPerH', '-3', /Clearance must be/],
    ['absorptionRatePerH', '0', /Absorption rate must be/],
    ['durationHours', '0.5', /Duration must be from 1 to 168/],
    ['durationHours', '169', /Duration must be from 1 to 168/],
    ['clearanceMultiplier', '0.05', /Multiplier must be from 0.1 to 10/],
    ['clearanceMultiplier', '11', /Multiplier must be from 0.1 to 10/],
    ['label', '  ', /label/i],
  ] as const)('rejects %s = %s', (field, value, message) => {
    const errors = validateForm({ ...base, [field]: value })
    expect(errors[field]).toMatch(message)
  })

  it('validates the explicit altered clearance only in explicit mode', () => {
    expect(validateForm({ ...base, alteredClearanceLPerH: '' }).alteredClearanceLPerH).toBeUndefined()
    const explicit = validateForm({ ...base, scenarioMode: 'explicit', alteredClearanceLPerH: '0' })
    expect(explicit.alteredClearanceLPerH).toMatch(/greater than 0/)
    expect(explicit.clearanceMultiplier).toBeUndefined()
  })

  it('validates Monte Carlo samples only when enabled', () => {
    expect(validateForm({ ...base, samples: '5' }).samples).toBeUndefined()
    expect(validateForm({ ...base, mcEnabled: true, samples: '49' }).samples).toMatch(/50 to 1000/)
    expect(validateForm({ ...base, mcEnabled: true, samples: '1001' }).samples).toMatch(/50 to 1000/)
  })
})

describe('buildRequest', () => {
  it('sends exactly one of multiplier or explicit clearance', () => {
    expect(buildRequest(base).comparison).toEqual({ clearanceMultiplier: 0.7, label: 'Hypothetical: clearance reduced to 70%' })
    const explicit = buildRequest({ ...base, scenarioMode: 'explicit', alteredClearanceLPerH: '5' })
    expect(explicit.comparison).toEqual({ alteredClearanceLPerH: 5, label: base.label })
  })

  it('omits contextual unless filled, and sends only what the user typed', () => {
    expect(buildRequest(base).contextual).toBeUndefined()
    expect(buildRequest({ ...base, ageYears: '70', cypPhenotype: 'poor_metabolizer' }).contextual).toEqual({
      ageYears: 70,
      cypPhenotype: 'poor_metabolizer',
    })
  })

  it('enables Monte Carlo with samples', () => {
    expect(buildRequest({ ...base, mcEnabled: true, samples: '120' }).monteCarlo).toEqual({ enabled: true, samples: 120 })
  })
})

describe('scenario label', () => {
  it('follows the multiplier and explicit clearance until the user edits it', () => {
    let f = applyPatch(base, { clearanceMultiplier: '0.5' })
    expect(f.label).toBe('Hypothetical: clearance × 0.5')
    f = applyPatch(f, { scenarioMode: 'explicit', alteredClearanceLPerH: '5' })
    expect(f.label).toBe('Hypothetical: clearance of 5 L/h')
    f = applyPatch(f, { label: 'My scenario' })
    expect(applyPatch(f, { alteredClearanceLPerH: '6' }).label).toBe('My scenario')
  })

  it('keeps a typed label when the preset label is replaced only if edited', () => {
    expect(applyPatch(base, { doseMg: '120' }).label).toBe(base.label)
  })
})
