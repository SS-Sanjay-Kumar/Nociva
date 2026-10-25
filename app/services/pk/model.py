"""One-compartment oral pharmacokinetic model (first-order absorption and elimination).

Closed form, with F = bioavailability, D = dose, V = volume, ka/ke = rate constants:

    C(t) = F*D*ka / (V*(ka - ke)) * (exp(-ke*t) - exp(-ka*t)),   ke = CL / V

and the ka ~ ke limit  C(t) = F*D*ka*t*exp(-ke*t) / V.
Functions broadcast over numpy arrays so Monte Carlo can evaluate many
(CL, V) draws at once. Units: mg, L, h, so concentration is mg/L.
"""

from __future__ import annotations

import numpy as np

STEP_HOURS = 0.05
MAX_POINTS = 2001
LIMIT_TOLERANCE = 1e-9


def time_grid(duration_hours: float) -> np.ndarray:
    """0.05 h steps, capped at 2001 points (coarser step for long windows)."""
    n = min(int(round(duration_hours / STEP_HOURS)) + 1, MAX_POINTS)
    return np.linspace(0.0, float(duration_hours), n)


def near_equal_rates(ka, ke):
    ka, ke = np.asarray(ka, dtype=float), np.asarray(ke, dtype=float)
    return np.abs(ka - ke) <= LIMIT_TOLERANCE * np.maximum(ka, ke)


def concentration(t, dose_mg, bioavailability, volume_l, clearance_l_per_h, ka):
    """Plasma concentration (mg/L). `t` has shape (T,); scalar or (N,1) parameters broadcast."""
    t = np.asarray(t, dtype=float)
    v = np.asarray(volume_l, dtype=float)
    ke = np.asarray(clearance_l_per_h, dtype=float) / v
    ka = np.asarray(ka, dtype=float)
    fd = bioavailability * dose_mg
    close = near_equal_rates(ka, ke)
    diff = np.where(close, 1.0, ka - ke)  # placeholder where the limit form is used
    general = fd * ka / (v * diff) * (np.exp(-ke * t) - np.exp(-ka * t))
    limit = fd * ka * t * np.exp(-ke * t) / v
    c = np.where(close, limit, general)
    return np.where(c < 0.0, 0.0, c)  # clamp tiny negative float noise
