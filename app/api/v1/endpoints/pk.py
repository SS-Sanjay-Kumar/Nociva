"""Stream 2: pharmacokinetic simulator router (pure computation, no database)."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter

from app.models.pk import Preset, SimulateRequest, SimulateResponse
from app.services.pk.presets import PRESETS
from app.services.pk.service import simulate as run_simulation

router = APIRouter(prefix="/api/pk", tags=["pk"])


@router.post("/simulate", response_model=SimulateResponse, response_model_exclude_none=True)
def simulate(request: SimulateRequest) -> SimulateResponse:
    return run_simulation(request)


@router.get("/presets", response_model=List[Preset], response_model_exclude_none=True)
def presets() -> List[Preset]:
    return [Preset(id=p["id"], description=p["description"], request=SimulateRequest(**p["request"])) for p in PRESETS]
