"""Monte Carlo variability on clearance and volume (assumed demonstration distributions)."""

from __future__ import annotations

import math
from typing import Dict

import numpy as np

from app.services.pk.metrics import auc_trapezoid, cmax_tmax
from app.services.pk.model import concentration

LABEL = "Assumed demonstration distributions; not a validated prediction interval."


def lognormal_factors(rng: np.random.Generator, samples: int, cv: float) -> np.ndarray:
    """Mean-1 lognormal multipliers with coefficient of variation `cv`."""
    sigma = math.sqrt(math.log(1.0 + cv * cv))
    z = rng.standard_normal(samples)
    return np.exp(-0.5 * sigma * sigma + sigma * z)


def _percentiles(a: np.ndarray, axis=None):
    p5, p50, p95 = np.percentile(a, [5, 50, 95], axis=axis)
    return p5, p50, p95


def run(
    t: np.ndarray,
    dose_mg: float,
    bioavailability: float,
    volume_l: float,
    ka: float,
    clearances: Dict[str, float],
    duration_hours: float,
    samples: int,
    clearance_cv: float,
    volume_cv: float,
    seed: int,
) -> Dict[str, dict]:
    """Per scenario: per-time p5/p50/p95 plus Cmax and AUC percentiles.

    Common random numbers: one draw of CL and V multipliers is shared by every
    scenario, so differences between scenarios are not Monte Carlo noise.
    """
    rng = np.random.default_rng(seed)
    cl_factor = lognormal_factors(rng, samples, clearance_cv)[:, None]
    v_draw = (volume_l * lognormal_factors(rng, samples, volume_cv))[:, None]
    out: Dict[str, dict] = {}
    for name, cl in clearances.items():
        cl_draw = cl * cl_factor
        curves = concentration(t[None, :], dose_mg, bioavailability, v_draw, cl_draw, ka)
        cmax, _ = cmax_tmax(dose_mg, bioavailability, v_draw[:, 0], cl_draw[:, 0], ka, duration_hours)
        auc = auc_trapezoid(t, curves)
        p5, p50, p95 = _percentiles(curves, axis=0)
        out[name] = {
            "bands": (p5, p50, p95),
            "cmax": _percentiles(cmax),
            "auc": _percentiles(auc),
        }
    return out
