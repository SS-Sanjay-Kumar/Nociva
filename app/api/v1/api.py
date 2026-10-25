from fastapi import APIRouter
from app.api.v1.endpoints import evaluate, search

api_router = APIRouter()
api_router.include_router(evaluate.router, prefix="", tags=["Clinical Evaluation"])
api_router.include_router(search.router, prefix="/drugs", tags=["Drugs Search"])