"""
GeneCollision backend entry point.

NOTE FOR TEAMMATE: this file did not exist yet when Stream 1 (Molecular
Intelligence Engine) was implemented, so this is a minimal scaffold, not a
competing backend. It currently only wires up:
  - CORS for local frontend dev origins
  - GET /health
  - the Stream 1 molecular router (app/routers/molecular.py)

Please merge your Supabase-backed routes and startup/config logic into
this file (or replace it) rather than creating a second FastAPI() app.
See INTEGRATION.md at the repo root for the exact integration contract.
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.molecular import router as molecular_router

app = FastAPI(title="GeneCollision API", version="0.1.0")

LOCAL_FRONTEND_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=LOCAL_FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(molecular_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
