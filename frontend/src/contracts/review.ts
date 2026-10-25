import { z } from 'zod'

/**
 * Runtime contract for the Medication Review API, built with zod.
 *
 * This is the single source of truth: docs/contracts/review.schema.json is
 * generated from these schemas (see scripts/generate-review-schema.mjs,
 * `npm run schema:review`) rather than hand-maintained separately.
 *
 * Unknown object keys are allowed (zod's default — it strips keys it
 * doesn't recognise rather than failing), so a backend that adds a field
 * later doesn't break existing clients. Missing required fields or a wrong
 * enum value do fail validation.
 */

export const PhenotypeSchema = z.enum([
  'poor_metabolizer',
  'intermediate_metabolizer',
  'normal_metabolizer',
  'rapid_metabolizer',
  'ultrarapid_metabolizer',
  'non_expresser',
  'intermediate_expresser',
  'indeterminate',
])

export const GenotypeSchema = z.object({
  gene: z.string(),
  diplotype: z.string().optional(),
  phenotype: PhenotypeSchema.optional(),
  activityScore: z.number().optional(),
  missing: z.boolean().optional(),
})

export const PatientProfileSchema = z.object({
  id: z.string(),
  label: z.string(),
  age: z.number(),
  sex: z.enum(['female', 'male', 'other']),
  genotypes: z.array(GenotypeSchema),
  context: z.string().optional(),
  notes: z.string().optional(),
})

export const MedicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  rxnormId: z.string().optional(),
  smiles: z.string().optional(),
  drugClass: z.string().optional(),
})

export const EvidenceStatusSchema = z.enum([
  'association_found',
  'no_documented_association',
  'insufficient_evidence',
])

export const EvidenceReferenceSchema = z.object({
  source: z.string(),
  citation: z.string(),
  url: z.string().optional(),
  guidelineId: z.string().optional(),
  annotationVersion: z.string().optional(),
  lastUpdated: z.string().optional(),
  /** Plain-text guideline summary (never HTML). */
  quote: z.string().optional(),
})

export const LiteratureLinkSchema = z.object({
  pmid: z.string(),
  url: z.string(),
  status: z.enum(['associated', 'ambiguous']).optional(),
})

export const AssociationSchema = z.object({
  ruleId: z.string(),
  kind: z.enum(['gene_drug', 'gene_drug_drug']),
  gene: z.string(),
  medication: z.string(),
  inhibitor: z.string().optional(),
  guidelineIds: z.array(z.string()),
  /** Related reading only; never used to change the verdict. */
  literature: z.array(LiteratureLinkSchema).optional(),
})

export const FlowNodeSchema = z.object({
  kind: z.enum(['gene', 'inhibitor', 'substrate', 'effect', 'unknown', 'missing']),
  label: z.string(),
  title: z.string(),
  sub: z.string(),
})

export const CheckItemSchema = z.object({
  label: z.string(),
  note: z.string(),
  missing: z.boolean(),
})

export const ClinicalVerdictSchema = z.object({
  evidenceStatus: EvidenceStatusSchema,
  summary: z.string(),
  recommendation: z.string().optional(),
  references: z.array(EvidenceReferenceSchema),
  limitations: z.array(z.string()),
  mechanism: z.array(FlowNodeSchema).optional(),
  checks: z.array(CheckItemSchema).optional(),
  missingData: z.array(z.string()).optional(),
  associations: z.array(AssociationSchema).optional(),
  evidenceBasis: z.string().optional(),
  ruleId: z.string().optional(),
  engineVersion: z.string().optional(),
  evidenceSnapshot: z.string().optional(),
})

export const AssessmentResultSchema = z.object({
  patientId: z.string(),
  medications: z.array(MedicationSchema),
  verdict: ClinicalVerdictSchema,
  generatedAt: z.string(),
  isMock: z.boolean(),
})

export const PatientListSchema = z.array(PatientProfileSchema)
export const MedicationListSchema = z.array(MedicationSchema)

export const GeneInfoSchema = z.object({
  gene: z.string(),
  guidelineCount: z.number().int().nonnegative(),
})
export const GeneListSchema = z.array(GeneInfoSchema)
