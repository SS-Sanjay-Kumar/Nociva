"""Guideline-backed Medication Review endpoints (read-only)."""

from __future__ import annotations

from datetime import datetime, timezone
from functools import lru_cache
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.review import AssessmentResult, AssessRequest, MedicationSuggestion
from app.services.review_engine import ReviewEngine

router = APIRouter()


@lru_cache()
def get_review_engine() -> ReviewEngine:
    # Imports are lazy: no Settings()/database access until the first request.
    from app.repositories.guideline_rules_repo import GuidelineRulesRepository
    from app.repositories.literature_repo import LiteratureRepository
    from app.repositories.supabase_readonly import make_readonly_client

    client = make_readonly_client()
    return ReviewEngine(GuidelineRulesRepository(client), LiteratureRepository(client))


def engine_dependency() -> ReviewEngine:
    try:
        return get_review_engine()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.post("/assess", response_model=AssessmentResult, response_model_exclude_none=True)
def assess(request: AssessRequest, engine: ReviewEngine = Depends(engine_dependency)):
    result = engine.assess(request)
    return AssessmentResult(
        patientId=result["patientId"],
        medications=result["medications"],
        verdict=result["verdict"],
        generatedAt=datetime.now(timezone.utc).isoformat(),
        isMock=False,
    )


@router.get("/medications", response_model=List[MedicationSuggestion])
def medications(query: str = Query("", max_length=100), engine: ReviewEngine = Depends(engine_dependency)):
    return engine.search_medications(query)
