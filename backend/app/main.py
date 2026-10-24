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

# Any port on localhost/127.0.0.1 — Vite's dev port moves around when 5173
# is already taken by something else on the machine. Local-only: the regex
# anchors to localhost/127.0.0.1 exactly, so this never opens CORS to a
# real remote origin.
LOCAL_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=LOCAL_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(molecular_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
