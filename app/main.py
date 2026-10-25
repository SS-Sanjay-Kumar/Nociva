import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from app.api.v1.endpoints.molecular import router as molecular_router
from app.api.v1.endpoints.pk import router as pk_router

# The Supabase-backed routes (his evaluate/search plus /review) load app.core.config
# on import, and Settings() fails without SUPABASE_* in .env. The molecular and PK
# routers need no database, so they always mount; only the legacy api_router is optional.
try:
    from app.api.v1.api import api_router
    from app.core.config import settings

    PROJECT_NAME = settings.PROJECT_NAME
except (ImportError, ValidationError):
    api_router = None
    PROJECT_NAME = "Nociva"
    logging.getLogger("uvicorn.error").warning("Supabase-backed routes disabled: .env missing")

app = FastAPI(
    title=PROJECT_NAME,
    version="1.0.0",
    description="Deterministic Epistatic Pharmacogenomics Clinical Decision Support API"
)

# Any port on localhost/127.0.0.1 (Vite's dev port moves). Local-only.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if api_router is not None:
    app.include_router(api_router, prefix="/api/v1")
# Stream 1: the router carries its own /api/molecular prefix, so the public
# URLs stay /api/molecular/analyze and /api/molecular/model-info.
app.include_router(molecular_router)
# Stream 2: pharmacokinetic simulator, router carries its own /api/pk prefix.
app.include_router(pk_router)

@app.get("/health", tags=["Health Check"])
def health_check():
    return {"status": "ok"}