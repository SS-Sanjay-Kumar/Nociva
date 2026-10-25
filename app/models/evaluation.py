from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class EvaluationRequest(BaseModel):
    patient_id: str
    patient_genotypes: Dict[str, str]
    drug_cocktail: List[str]

class BottleneckItem(BaseModel):
    enzyme: str
    competing_drugs: List[str]
    patient_phenotype: str
    risk_level: str
    mechanism: str

class GuidelineItem(BaseModel):
    guideline_id: str
    source: str
    recommendation_summary: str

class EvaluationResponse(BaseModel):
    evaluation_status: str
    input_drugs: List[str]
    detected_bottlenecks: List[BottleneckItem]
    clinical_guidelines: List[GuidelineItem]