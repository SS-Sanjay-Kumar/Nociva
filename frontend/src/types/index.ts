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
  | 'indeterminate'

export interface Genotype {
  gene: string
  diplotype: string
  phenotype: Phenotype
}

export interface PatientProfile {
  id: string
  label: string
  age: number
  sex: 'female' | 'male' | 'other'
  genotypes: Genotype[]
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
}

export interface ClinicalVerdict {
  evidenceStatus: EvidenceStatus
  summary: string
  recommendation?: string
  references: EvidenceReference[]
  limitations: string[]
}

export interface AssessmentResult {
  patientId: string
  medication: Medication
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
}

export interface MolecularAnalysisResponse {
  inputSmiles: string
  canonicalSmiles: string | null
  valid: boolean
  neighbors: SimilarityNeighbor[]
  cyp2d6: {
    modelTrained: boolean
    prediction?: Cyp2d6Prediction
  }
  provenance: {
    dataset: string
    license: string
    method: string
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

export type RequestState = 'idle' | 'loading' | 'success' | 'error' | 'unsupported'

export interface ApiError {
  message: string
  detail?: string
  status?: number
}
