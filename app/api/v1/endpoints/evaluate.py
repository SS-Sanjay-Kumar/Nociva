from fastapi import APIRouter, Depends
from app.models.evaluation import EvaluationRequest, EvaluationResponse
from app.repositories.relation_repo import RelationRepository
from app.repositories.guideline_repo import GuidelineRepository
from app.repositories.variant_repo import VariantRepository
from app.services.engine import DeterministicEngineService

router = APIRouter()

def get_engine_service() -> DeterministicEngineService:

    return DeterministicEngineService(
        relation_repo=RelationRepository(),
        guideline_repo=GuidelineRepository(),
        variant_repo=VariantRepository()
    )

@router.post("/evaluate", response_model=EvaluationResponse)
def evaluate_patient_medications(
    payload: EvaluationRequest,
    service: DeterministicEngineService = Depends(get_engine_service)
):
    
    #* evaluates multi-drug metabolic collisions based on patient genotype and drug cocktail.
    #* runs entirely deterministically with zero AI hallucination risk.
    
    result = service.evaluate(
        patient_genotypes=payload.patient_genotypes,
        drug_cocktail=payload.drug_cocktail
    )
    
    return result