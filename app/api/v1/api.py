from fastapi import APIRouter
from app.api.v1.endpoints import evaluate, review, search

api_router = APIRouter()
api_router.include_router(evaluate.router, prefix="", tags=["Clinical Evaluation"])
api_router.include_router(search.router, prefix="/drugs", tags=["Drugs Search"])
api_router.include_router(review.router, prefix="/review", tags=["Medication Review"])
