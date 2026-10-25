/**
 * Shared type contracts for GeneCollision frontend.
 *
 * These interfaces define the expected shape of data exchanged with the
 * backend. See INTEGRATION.md at the repo root for the authoritative API
 * contract documentation shared with the backend team.
 */

// ---------------------------------------------------------------------------
// Medication Review domain (Stream: Medication Review / clinical verdicts)
// ---------------------------------------------------------------------------

export type Phenotype =
  | 'poor_metabolizer'
  | 'intermediate_metabolizer'
  | 'normal_metabolizer'
  | 'rapid_metabolizer'
  | 'ultrarapid_metabolizer'
  | 'non_expresser'
  | 'indeterminate'

export interface Genotype {
  gene: string
  diplotype?: string
  phenotype?: Phenotype
  /** 0-3 CPIC/DPWG-style activity score, only meaningful for CYP2D6 in this demo. */
  activityScore?: number
  /** True when no result is on file for this gene. */
  missing?: boolean
}

export interface PatientProfile {
  id: string
  label: string
  age: number
  sex: 'female' | 'male' | 'other'
  genotypes: Genotype[]
  /** Short synthetic clinical context shown as a patient subtitle, e.g. "Adjuvant breast cancer therapy". */
  context?: string
  notes?: string
}

export interface Medication {
  id: string
  name: string
  rxnormId?: string
  smiles?: string
  drugClass?: string
}

/**
 * Evidence status is returned by the backend's deterministic rule engine.
 * The frontend NEVER computes this value — it only renders what the API
 * (or the mock fixtures standing in for it) returns.
 */
export type EvidenceStatus =
  | 'association_found'
  | 'no_documented_association'
  | 'insufficient_evidence'

export interface EvidenceReference {
  source: string
  citation: string
  url?: string
  guidelineId?: string
  annotationVersion?: string
  lastUpdated?: string
  /** Plain-text guideline summary (never HTML). */
  quote?: string
}

export interface LiteratureLink {
  pmid: string
  url: string
}

export interface Association {
  ruleId: string
  kind: 'gene_drug' | 'gene_drug_drug'
  gene: string
  medication: string
  inhibitor?: string
  guidelineIds: string[]
  literature?: LiteratureLink[]
}

export type FlowNodeKind = 'gene' | 'inhibitor' | 'substrate' | 'effect' | 'unknown' | 'missing'

export interface FlowNode {
  kind: FlowNodeKind
  label: string
  title: string
  sub: string
}

export interface CheckItem {
  label: string
  note: string
  missing: boolean
}

export interface ClinicalVerdict {
  evidenceStatus: EvidenceStatus
  summary: string
  /**
   * Guideline-sourced action text from the backend, if it supplies any.
   * Never populated by the mock fixtures — see features/review/copy.ts and
   * VerdictCard, which label this "Guideline text" rather than
   * "Recommendation" to make clear it is not frontend-authored advice.
   */
  recommendation?: string
  references: EvidenceReference[]
  limitations: string[]
  /** Four-node mechanism flow (gene -> inhibitor -> substrate -> effect), when a rule applies. */
  mechanism?: FlowNode[]
  /** Per-medication-pair check list, rendered instead of `mechanism` when no single rule applies. */
  checks?: CheckItem[]
  /** Data the engine would have needed but did not have, distinct from `limitations`. */
  missingData?: string[]
  associations?: Association[]
  evidenceBasis?: string
  ruleId?: string
  engineVersion?: string
  evidenceSnapshot?: string
}

export interface AssessmentResult {
  patientId: string
  /** The full medication list this single verdict was evaluated against. */
  medications: Medication[]
  verdict: ClinicalVerdict
  generatedAt: string
  /** True when this result came from a labelled mock fixture, not a live backend. */
  isMock: boolean
}

export interface AssessmentRequest {
  patientId: string
  medicationIds: string[]
}

// ---------------------------------------------------------------------------
// Molecular Intelligence Engine domain (Stream 1)
// ---------------------------------------------------------------------------

export interface SimilarityNeighbor {
  identifier: string
  smiles: string
  canonicalSmiles: string
  tanimotoSimilarity: number
  imageBase64?: string | null
}

export type Cyp2d6PredictedClass = 'inhibitor' | 'non_inhibitor'

export interface Cyp2d6Prediction {
  predictedClass: Cyp2d6PredictedClass
  rawScore: number
  scoreCalibrated: boolean
  applicabilityWarning?: string | null
}

export interface ModelMetrics {
  auprc: number
  rocAuc: number | null
  precision: number
  recall: number
  f1: number
  confusionMatrix: number[][]
  positiveClassPrevalence: number
  nTrain: number
  nValidation: number
  nTest: number
  decisionThreshold?: number | null
}

export interface ModelInfo {
  trained: boolean
  modelType: string
  nEstimators?: number
  fingerprint: {
    type: string
    radius: number
    nBits: number
  }
  dataset: {
    name: string
    license: string
    source: string
  }
  metrics?: ModelMetrics
  splitMethod?: string | null
  randomSeed?: number | null
}

export interface MolecularAnalysisResponse {
  inputSmiles: string
  canonicalSmiles: string | null
  valid: boolean
  queryImageBase64?: string | null
  molecularFormula?: string | null
  molecularWeight?: number | null
  neighbors: SimilarityNeighbor[]
  /** Highest Tanimoto similarity found, even if below reportingThreshold and so excluded from `neighbors`. */
  maxSimilarity?: number | null
  /** True when the query is (near-)identical to a compound the classifier was trained on. */
  inTrainingSet?: boolean
  cyp2d6: {
    modelTrained: boolean
    prediction?: Cyp2d6Prediction
  }
  provenance: {
    dataset: string
    license: string
    method: string
    fingerprint?: { type: string; radius: number; nBits: number } | null
    referenceSetSize?: number | null
    reportingThreshold?: number | null
  }
  limitations: string[]
  error?: string | null
}

export interface MolecularAnalysisRequest {
  smiles: string
}

// ---------------------------------------------------------------------------
// Generic UI / API plumbing
// ---------------------------------------------------------------------------

export type RequestState = 'idle' | 'loading' | 'success' | 'error' | 'unsupported' | 'contract_error'

export interface ApiError {
  message: string
  detail?: string
  status?: number
}
