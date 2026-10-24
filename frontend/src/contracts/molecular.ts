import { z } from 'zod'

/**
 * Runtime contract for the Molecular Explorer API, built with zod.
 * See contracts/review.ts for the shared design notes (unknown keys
 * allowed, this is the single source of truth for the shape).
 */

export const SimilarityNeighborSchema = z.object({
  identifier: z.string(),
  smiles: z.string(),
  canonicalSmiles: z.string(),
  tanimotoSimilarity: z.number(),
  imageBase64: z.string().nullable().optional(),
})

export const Cyp2d6PredictedClassSchema = z.enum(['inhibitor', 'non_inhibitor'])

export const Cyp2d6PredictionSchema = z.object({
  predictedClass: Cyp2d6PredictedClassSchema,
  rawScore: z.number(),
  scoreCalibrated: z.boolean(),
  applicabilityWarning: z.string().nullable().optional(),
})

export const FingerprintInfoSchema = z.object({
  type: z.string(),
  radius: z.number(),
  nBits: z.number(),
})

export const ModelMetricsSchema = z.object({
  auprc: z.number(),
  rocAuc: z.number().nullable(),
  precision: z.number(),
  recall: z.number(),
  f1: z.number(),
  confusionMatrix: z.array(z.array(z.number())),
  positiveClassPrevalence: z.number(),
  nTrain: z.number(),
  nValidation: z.number(),
  nTest: z.number(),
  decisionThreshold: z.number().nullable().optional(),
})

export const ModelInfoSchema = z.object({
  trained: z.boolean(),
  modelType: z.string(),
  nEstimators: z.number().optional(),
  fingerprint: FingerprintInfoSchema,
  dataset: z.object({
    name: z.string(),
    license: z.string(),
    source: z.string(),
  }),
  metrics: ModelMetricsSchema.optional(),
  splitMethod: z.string().nullable().optional(),
  randomSeed: z.number().nullable().optional(),
})

export const MolecularAnalysisResponseSchema = z.object({
  inputSmiles: z.string(),
  canonicalSmiles: z.string().nullable(),
  valid: z.boolean(),
  queryImageBase64: z.string().nullable().optional(),
  molecularFormula: z.string().nullable().optional(),
  molecularWeight: z.number().nullable().optional(),
  neighbors: z.array(SimilarityNeighborSchema),
  maxSimilarity: z.number().nullable().optional(),
  inTrainingSet: z.boolean().optional(),
  cyp2d6: z.object({
    modelTrained: z.boolean(),
    prediction: Cyp2d6PredictionSchema.optional(),
  }),
  provenance: z.object({
    dataset: z.string(),
    license: z.string(),
    method: z.string(),
    fingerprint: FingerprintInfoSchema.nullable().optional(),
    referenceSetSize: z.number().nullable().optional(),
    reportingThreshold: z.number().nullable().optional(),
  }),
  limitations: z.array(z.string()),
  error: z.string().nullable().optional(),
})
