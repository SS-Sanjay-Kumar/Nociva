from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app.api.v1.endpoints.molecular import router as molecular_router
from app.api.v1.endpoints.pk import router as pk_router
from app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
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

app.include_router(api_router, prefix="/api/v1")
# Stream 1: the router carries its own /api/molecular prefix, so the public
# URLs stay /api/molecular/analyze and /api/molecular/model-info.
app.include_router(molecular_router)
# Stream 2: pharmacokinetic simulator, router carries its own /api/pk prefix.
app.include_router(pk_router)

@app.get("/health", tags=["Health Check"])
def health_check():
    return {"status": "ok"}