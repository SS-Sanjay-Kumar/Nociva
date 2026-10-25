"""Request/response models for the pharmacokinetic simulator.

Wire format is camelCase; snake_case field names are accepted on input too
(populate_by_name). No imports from app.core.
"""

from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel

MODEL_VERSION = "PK one-compartment v1.0"
VALIDATION_STATUS = "Not clinically validated"
CONTEXT_NOTE = "Contextual information only; not used in the calculation"


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, protected_namespaces=())


class Comparison(CamelModel):
    clearance_multiplier: Optional[float] = Field(None, ge=0.1, le=10)
    altered_clearance_l_per_h: Optional[float] = Field(None, gt=0)
    label: str = Field("Hypothetical altered clearance", min_length=1, max_length=120)

    @model_validator(mode="after")
    def exactly_one(self):
        if (self.clearance_multiplier is None) == (self.altered_clearance_l_per_h is None):
            raise ValueError("Provide exactly one of clearanceMultiplier or alteredClearanceLPerH")
        return self


class MonteCarloSettings(CamelModel):
    enabled: bool = False
    samples: int = Field(300, ge=50, le=1000)
    clearance_cv: float = Field(0.30, gt=0, le=2)
    volume_cv: float = Field(0.20, gt=0, le=2)
    seed: int = 42


class Contextual(CamelModel):
    age_years: Optional[float] = Field(None, ge=0, le=130)
    weight_kg: Optional[float] = Field(None, gt=0, le=500)
    egfr: Optional[float] = Field(None, ge=0, le=300)
    cyp_phenotype: Optional[str] = Field(None, max_length=60)
    concomitant_medication: Optional[str] = Field(None, max_length=200)


class SimulateRequest(CamelModel):
    compound_name: str = Field(..., min_length=1, max_length=80)
    route: Literal["oral"] = "oral"
    dose_mg: float = Field(..., ge=0, le=10000)
    bioavailability: float = Field(..., gt=0, le=1)
    volume_l: float = Field(..., gt=0)
    clearance_l_per_h: float = Field(..., gt=0)
    absorption_rate_per_h: float = Field(..., gt=0)
    duration_hours: float = Field(24, ge=1, le=168)
    comparison: Optional[Comparison] = None
    monte_carlo: Optional[MonteCarloSettings] = None
    contextual: Optional[Contextual] = None


# ---- responses -----------------------------------------------------------

class Metrics(CamelModel):
    cmax_mg_per_l: float
    tmax_h: float
    auc_mg_h_per_l: float
    half_life_h: float


class RelativeExposure(CamelModel):
    auc_ratio: Optional[float] = None
    auc_percent_change: Optional[float] = None


class Scenario(CamelModel):
    label: str
    hypothetical: bool
    clearance_l_per_h: float
    concentration_mg_per_l: List[float]
    metrics: Metrics
    relative_exposure: Optional[RelativeExposure] = None


class Band(CamelModel):
    p5: List[float]
    p50: List[float]
    p95: List[float]


class Percentiles(CamelModel):
    p5: float
    p50: float
    p95: float


class MonteCarloScenario(CamelModel):
    concentration_bands: Band
    cmax_mg_per_l: Percentiles
    auc_mg_h_per_l: Percentiles


class MonteCarloResult(CamelModel):
    label: str
    samples: int
    clearance_cv: float
    volume_cv: float
    seed: int
    baseline: MonteCarloScenario
    altered: Optional[MonteCarloScenario] = None


class ContextualEcho(Contextual):
    note: str = CONTEXT_NOTE


class Provenance(CamelModel):
    synthetic: bool
    source: str


class Units(CamelModel):
    time: str = "h"
    concentration: str = "mg/L"
    auc: str = "mg·h/L"
    dose: str = "mg"
    volume: str = "L"
    clearance: str = "L/h"


class SimulateResponse(CamelModel):
    model_version: str
    compound_name: str
    route: str
    dose_mg: float
    duration_hours: float
    units: Units
    time_hours: List[float]
    baseline: Scenario
    altered: Optional[Scenario] = None
    monte_carlo: Optional[MonteCarloResult] = None
    interpretation: str
    contextual: Optional[ContextualEcho] = None
    provenance: Provenance
    assumptions: List[str]
    limitations: List[str]
    validation_status: str


class Preset(CamelModel):
    id: str
    description: str
    request: SimulateRequest
