from __future__ import annotations

from pydantic import BaseModel, Field


class MolecularAnalyzeRequest(BaseModel):
    smiles: str = Field(..., min_length=1, max_length=500)


class SimilarityNeighbor(BaseModel):
    identifier: str
    smiles: str
    canonicalSmiles: str
    tanimotoSimilarity: float
    imageBase64: str | None = None


class Cyp2d6Prediction(BaseModel):
    predictedClass: str
    rawScore: float
    scoreCalibrated: bool
    applicabilityWarning: str | None = None


class Cyp2d6Result(BaseModel):
    modelTrained: bool
    prediction: Cyp2d6Prediction | None = None


class FingerprintInfo(BaseModel):
    type: str
    radius: int
    nBits: int


class Provenance(BaseModel):
    dataset: str
    license: str
    method: str
    fingerprint: FingerprintInfo | None = None
    referenceSetSize: int | None = None
    reportingThreshold: float | None = None


class MolecularAnalyzeResponse(BaseModel):
    inputSmiles: str
    canonicalSmiles: str | None
    valid: bool
    queryImageBase64: str | None = None
    molecularFormula: str | None = None
    molecularWeight: float | None = None
    neighbors: list[SimilarityNeighbor] = []
    # Highest Tanimoto similarity found among reference compounds, even if
    # below reportingThreshold and therefore not included in `neighbors`.
    maxSimilarity: float | None = None
    cyp2d6: Cyp2d6Result
    provenance: Provenance
    limitations: list[str] = []
    error: str | None = None


class DatasetInfo(BaseModel):
    name: str
    license: str
    source: str


class ModelMetrics(BaseModel):
    auprc: float
    rocAuc: float | None
    precision: float
    recall: float
    f1: float
    confusionMatrix: list[list[int]]
    positiveClassPrevalence: float
    nTrain: int
    nValidation: int
    nTest: int
    decisionThreshold: float | None = None


class ModelInfoResponse(BaseModel):
    trained: bool
    modelType: str
    nEstimators: int | None = None
    fingerprint: FingerprintInfo
    dataset: DatasetInfo
    metrics: ModelMetrics | None = None
    splitMethod: str | None = None
    randomSeed: int | None = None
