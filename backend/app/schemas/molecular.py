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


class Provenance(BaseModel):
    dataset: str
    license: str
    method: str


class MolecularAnalyzeResponse(BaseModel):
    inputSmiles: str
    canonicalSmiles: str | None
    valid: bool
    neighbors: list[SimilarityNeighbor] = []
    cyp2d6: Cyp2d6Result
    provenance: Provenance
    limitations: list[str] = []
    error: str | None = None


class FingerprintInfo(BaseModel):
    type: str
    radius: int
    nBits: int


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


class ModelInfoResponse(BaseModel):
    trained: bool
    modelType: str
    nEstimators: int | None = None
    fingerprint: FingerprintInfo
    dataset: DatasetInfo
    metrics: ModelMetrics | None = None
