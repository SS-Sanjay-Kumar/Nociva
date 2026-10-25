"""Request/response models for the guideline-backed Medication Review API.

Response field names are camelCase and mirror frontend/src/contracts/review.ts.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel


class GenotypeIn(BaseModel):
    gene: str
    phenotype: Optional[str] = None
    diplotype: Optional[str] = None
    activityScore: Optional[float] = None


class MedicationIn(BaseModel):
    id: str
    name: str


class AssessRequest(BaseModel):
    patientId: str
    genotypes: List[GenotypeIn] = []
    medications: List[MedicationIn] = []


class MedicationOut(BaseModel):
    id: str
    name: str


class LiteratureLink(BaseModel):
    pmid: str
    url: str


class EvidenceReference(BaseModel):
    source: str
    citation: str
    url: Optional[str] = None
    guidelineId: Optional[str] = None
    annotationVersion: Optional[str] = None
    lastUpdated: Optional[str] = None
    quote: Optional[str] = None


class FlowNode(BaseModel):
    kind: Literal["gene", "inhibitor", "substrate", "effect", "unknown", "missing"]
    label: str
    title: str
    sub: str


class CheckItem(BaseModel):
    label: str
    note: str
    missing: bool


class Association(BaseModel):
    ruleId: str
    kind: Literal["gene_drug", "gene_drug_drug"]
    gene: str
    medication: str
    inhibitor: Optional[str] = None
    guidelineIds: List[str]
    literature: Optional[List[LiteratureLink]] = None


class ClinicalVerdict(BaseModel):
    evidenceStatus: Literal["association_found", "no_documented_association", "insufficient_evidence"]
    summary: str
    recommendation: Optional[str] = None
    references: List[EvidenceReference]
    limitations: List[str]
    mechanism: Optional[List[FlowNode]] = None
    checks: Optional[List[CheckItem]] = None
    missingData: Optional[List[str]] = None
    associations: Optional[List[Association]] = None
    evidenceBasis: Optional[str] = None
    ruleId: Optional[str] = None
    engineVersion: Optional[str] = None
    evidenceSnapshot: Optional[str] = None


class AssessmentResult(BaseModel):
    patientId: str
    medications: List[MedicationOut]
    verdict: ClinicalVerdict
    generatedAt: str
    isMock: bool = False


class MedicationSuggestion(BaseModel):
    id: str
    name: str
