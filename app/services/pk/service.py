"""Orchestrates one PK simulation. Pure computation: no network, no database, no settings."""

from __future__ import annotations

from typing import Optional

import numpy as np

from app.models.pk import (
    CONTEXT_NOTE,
    MODEL_VERSION,
    VALIDATION_STATUS,
    Band,
    ContextualEcho,
    Metrics,
    MonteCarloResult,
    MonteCarloScenario,
    Percentiles,
    Provenance,
    RelativeExposure,
    Scenario,
    SimulateRequest,
    SimulateResponse,
    Units,
)
from app.services.pk import montecarlo
from app.services.pk.metrics import auc_trapezoid, cmax_tmax, half_life_hours, relative_exposure
from app.services.pk.model import concentration, time_grid
from app.services.pk.presets import matches_preset

SIMILAR_WITHIN = 0.01  # AUC within 1% reads as "similar"

ASSUMPTIONS = [
    "One-compartment model with first-order absorption and first-order elimination.",
    "Single oral dose given at time 0; kinetics are linear and parameters are constant over time.",
    "Parameters are user-supplied or built-in synthetic demonstration values.",
    "The altered scenario changes clearance only, as specified by the user.",
]
LIMITATIONS = [
    "Single dose only.",
    "Oral route only.",
    "No real drug parameters are built in.",
    "No covariate model: age, weight, kidney function and CYP phenotype do not enter the calculation.",
    "No distribution or protein-binding model.",
    "Not clinically validated.",
]


def _r(a, digits=6):
    return [round(float(x), digits) for x in np.asarray(a).ravel()]


def interpret(base_cl: float, alt_cl: Optional[float], auc_ratio: Optional[float]) -> str:
    """Deterministic, direction-aware template. No safety, dosing or patient claims."""
    if alt_cl is None:
        return "No comparison scenario was specified, so only the baseline curve is shown."
    if auc_ratio is None:
        return "Predicted exposure could not be compared because the baseline exposure is zero."
    change = "reducing" if alt_cl < base_cl else "increasing" if alt_cl > base_cl else "keeping"
    if abs(auc_ratio - 1.0) <= SIMILAR_WITHIN:
        outcome = "similar predicted drug exposure (within 1% AUC)"
    elif auc_ratio > 1.0:
        outcome = "greater predicted drug exposure"
    else:
        outcome = "lower predicted drug exposure"
    return (
        f"Under the specified illustrative parameters, {change} clearance results in {outcome} "
        "over the simulation period."
    )


def _scenario(label, hypothetical, cl, t, req, auc_base=None) -> Scenario:
    c = concentration(t, req.dose_mg, req.bioavailability, req.volume_l, cl, req.absorption_rate_per_h)
    cmax, tmax = cmax_tmax(req.dose_mg, req.bioavailability, req.volume_l, cl, req.absorption_rate_per_h, req.duration_hours)
    auc = float(auc_trapezoid(t, c))
    rel = None
    if auc_base is not None:
        ratio, pct = relative_exposure(auc_base, auc)
        rel = RelativeExposure(auc_ratio=None if ratio is None else round(ratio, 6), auc_percent_change=None if pct is None else round(pct, 4))
    return Scenario(
        label=label,
        hypothetical=hypothetical,
        clearance_l_per_h=float(cl),
        concentration_mg_per_l=_r(c),
        metrics=Metrics(
            cmax_mg_per_l=round(float(cmax), 6),
            tmax_h=round(float(tmax), 4),
            auc_mg_h_per_l=round(auc, 6),
            half_life_h=round(half_life_hours(req.volume_l, float(cl)), 6),
        ),
        relative_exposure=rel,
    )


def _mc_scenario(entry) -> MonteCarloScenario:
    p5, p50, p95 = entry["bands"]
    return MonteCarloScenario(
        concentration_bands=Band(p5=_r(p5), p50=_r(p50), p95=_r(p95)),
        cmax_mg_per_l=Percentiles(**dict(zip(("p5", "p50", "p95"), (round(float(x), 6) for x in entry["cmax"])))),
        auc_mg_h_per_l=Percentiles(**dict(zip(("p5", "p50", "p95"), (round(float(x), 6) for x in entry["auc"])))),
    )


def simulate(req: SimulateRequest) -> SimulateResponse:
    t = time_grid(req.duration_hours)
    baseline = _scenario("Baseline", False, req.clearance_l_per_h, t, req)

    altered = None
    alt_cl = None
    if req.comparison is not None:
        cmp = req.comparison
        alt_cl = (
            req.clearance_l_per_h * cmp.clearance_multiplier
            if cmp.clearance_multiplier is not None
            else cmp.altered_clearance_l_per_h
        )
        # Always hypothetical, always the user's label; never derived from context or any verdict.
        altered = _scenario(cmp.label, True, alt_cl, t, req, auc_base=baseline.metrics.auc_mg_h_per_l)

    mc_result = None
    mc = req.monte_carlo
    if mc is not None and mc.enabled:
        clearances = {"baseline": req.clearance_l_per_h}
        if alt_cl is not None:
            clearances["altered"] = alt_cl
        out = montecarlo.run(
            t, req.dose_mg, req.bioavailability, req.volume_l, req.absorption_rate_per_h,
            clearances, req.duration_hours, mc.samples, mc.clearance_cv, mc.volume_cv, mc.seed,
        )
        mc_result = MonteCarloResult(
            label=montecarlo.LABEL,
            samples=mc.samples,
            clearance_cv=mc.clearance_cv,
            volume_cv=mc.volume_cv,
            seed=mc.seed,
            baseline=_mc_scenario(out["baseline"]),
            altered=_mc_scenario(out["altered"]) if "altered" in out else None,
        )

    ratio = altered.relative_exposure.auc_ratio if altered and altered.relative_exposure else None
    context = None
    if req.contextual is not None:
        context = ContextualEcho(**req.contextual.model_dump(), note=CONTEXT_NOTE)

    base_dict = req.model_dump(by_alias=True)
    return SimulateResponse(
        model_version=MODEL_VERSION,
        compound_name=req.compound_name,
        route=req.route,
        dose_mg=req.dose_mg,
        duration_hours=req.duration_hours,
        units=Units(),
        time_hours=_r(t, 4),
        baseline=baseline,
        altered=altered,
        monte_carlo=mc_result,
        interpretation=interpret(req.clearance_l_per_h, alt_cl, ratio),
        contextual=context,
        provenance=Provenance(
            synthetic=matches_preset(base_dict),
            source="User-supplied or built-in synthetic demonstration parameters",
        ),
        assumptions=ASSUMPTIONS,
        limitations=LIMITATIONS,
        validation_status=VALIDATION_STATUS,
    )
