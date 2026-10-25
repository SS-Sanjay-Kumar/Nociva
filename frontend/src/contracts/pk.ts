import { z } from 'zod'

/**
 * Runtime contract for the Pharmacokinetic Simulator API (POST /api/pk/simulate,
 * GET /api/pk/presets). Mirrors app/models/pk.py exactly (camelCase wire names).
 * docs/contracts/pk.schema.json is generated from these schemas
 * (`npm run schema:pk`). Fields the backend omits when null are optional here.
 */

export const PK_BOUNDS = {
  doseMg: { min: 0, max: 10000 },
  bioavailability: { exclusiveMin: 0, max: 1 },
  volumeL: { exclusiveMin: 0 },
  clearanceLPerH: { exclusiveMin: 0 },
  absorptionRatePerH: { exclusiveMin: 0 },
  durationHours: { min: 1, max: 168 },
  clearanceMultiplier: { min: 0.1, max: 10 },
  samples: { min: 50, max: 1000 },
} as const

export const ComparisonSchema = z.object({
  clearanceMultiplier: z.number().optional(),
  alteredClearanceLPerH: z.number().optional(),
  label: z.string(),
})

export const MonteCarloSettingsSchema = z.object({
  enabled: z.boolean(),
  samples: z.number(),
  clearanceCv: z.number(),
  volumeCv: z.number(),
  seed: z.number(),
})

export const ContextualSchema = z.object({
  ageYears: z.number().optional(),
  weightKg: z.number().optional(),
  egfr: z.number().optional(),
  cypPhenotype: z.string().optional(),
  concomitantMedication: z.string().optional(),
})

export const SimulateRequestSchema = z.object({
  compoundName: z.string(),
  route: z.literal('oral'),
  doseMg: z.number(),
  bioavailability: z.number(),
  volumeL: z.number(),
  clearanceLPerH: z.number(),
  absorptionRatePerH: z.number(),
  durationHours: z.number(),
  comparison: ComparisonSchema.optional(),
  monteCarlo: MonteCarloSettingsSchema.partial().optional(),
  contextual: ContextualSchema.optional(),
})

export const PkPresetSchema = z.object({
  id: z.string(),
  description: z.string(),
  request: SimulateRequestSchema,
})
export const PkPresetListSchema = z.array(PkPresetSchema)

export const MetricsSchema = z.object({
  cmaxMgPerL: z.number(),
  tmaxH: z.number(),
  aucMgHPerL: z.number(),
  halfLifeH: z.number(),
})

export const RelativeExposureSchema = z.object({
  aucRatio: z.number().optional(),
  aucPercentChange: z.number().optional(),
})

export const ScenarioSchema = z.object({
  label: z.string(),
  hypothetical: z.boolean(),
  clearanceLPerH: z.number(),
  concentrationMgPerL: z.array(z.number()),
  metrics: MetricsSchema,
  relativeExposure: RelativeExposureSchema.optional(),
})

const BandSchema = z.object({ p5: z.array(z.number()), p50: z.array(z.number()), p95: z.array(z.number()) })
const PercentilesSchema = z.object({ p5: z.number(), p50: z.number(), p95: z.number() })
const MonteCarloScenarioSchema = z.object({
  concentrationBands: BandSchema,
  cmaxMgPerL: PercentilesSchema,
  aucMgHPerL: PercentilesSchema,
})

export const MonteCarloResultSchema = z.object({
  label: z.string(),
  samples: z.number(),
  clearanceCv: z.number(),
  volumeCv: z.number(),
  seed: z.number(),
  baseline: MonteCarloScenarioSchema,
  altered: MonteCarloScenarioSchema.optional(),
})

export const ContextualEchoSchema = ContextualSchema.extend({ note: z.string() })

export const SimulateResponseSchema = z.object({
  modelVersion: z.string(),
  compoundName: z.string(),
  route: z.string(),
  doseMg: z.number(),
  durationHours: z.number(),
  units: z.object({
    time: z.string(),
    concentration: z.string(),
    auc: z.string(),
    dose: z.string(),
    volume: z.string(),
    clearance: z.string(),
  }),
  timeHours: z.array(z.number()),
  baseline: ScenarioSchema,
  altered: ScenarioSchema.optional(),
  monteCarlo: MonteCarloResultSchema.optional(),
  interpretation: z.string(),
  contextual: ContextualEchoSchema.optional(),
  provenance: z.object({ synthetic: z.boolean(), source: z.string() }),
  assumptions: z.array(z.string()),
  limitations: z.array(z.string()),
  validationStatus: z.string(),
})

export type SimulateRequest = z.infer<typeof SimulateRequestSchema>
export type SimulateResponse = z.infer<typeof SimulateResponseSchema>
export type PkPreset = z.infer<typeof PkPresetSchema>
export type PkScenario = z.infer<typeof ScenarioSchema>
