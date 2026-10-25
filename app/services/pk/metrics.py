"""Exposure metrics for the one-compartment oral model (mg, L, h)."""

from __future__ import annotations

import math

import numpy as np

from app.services.pk.model import concentration, near_equal_rates

LN2 = math.log(2.0)


def tmax_hours(volume_l, clearance_l_per_h, ka, duration_hours):
    """Analytic time of peak, ln(ka/ke)/(ka-ke) (limit 1/ke when ka ~ ke), clamped to [0, T]."""
    v = np.asarray(volume_l, dtype=float)
    ke = np.asarray(clearance_l_per_h, dtype=float) / v
    ka = np.asarray(ka, dtype=float)
    close = near_equal_rates(ka, ke)
    safe_diff = np.where(close, 1.0, ka - ke)
    general = np.log(ka / ke) / safe_diff
    t = np.where(close, 1.0 / ke, general)
    return np.clip(t, 0.0, duration_hours)


def cmax_tmax(dose_mg, bioavailability, volume_l, clearance_l_per_h, ka, duration_hours):
    """(Cmax mg/L, Tmax h) from the analytic peak, within the simulation window."""
    tmax = tmax_hours(volume_l, clearance_l_per_h, ka, duration_hours)
    cmax = concentration(tmax, dose_mg, bioavailability, volume_l, clearance_l_per_h, ka)
    return cmax, tmax


def auc_trapezoid(t, c):
    """AUC0-T (mg*h/L) by the trapezoid rule over the last axis."""
    return np.trapezoid(c, t, axis=-1)


def auc_analytic(dose_mg, bioavailability, volume_l, clearance_l_per_h, ka, duration_hours):
    """Closed-form AUC0-T = FD*ka/(V(ka-ke)) * ((1-e^-keT)/ke - (1-e^-kaT)/ka); limit form when ka ~ ke.

    The ka factor comes from integrating C(t) = FD*ka/(V(ka-ke)) * (e^-ke t - e^-ka t).
    """
    v = np.asarray(volume_l, dtype=float)
    ke = np.asarray(clearance_l_per_h, dtype=float) / v
    ka = np.asarray(ka, dtype=float)
    fd = bioavailability * dose_mg
    T = duration_hours
    close = near_equal_rates(ka, ke)
    diff = np.where(close, 1.0, ka - ke)
    general = fd * ka / (v * diff) * ((1 - np.exp(-ke * T)) / ke - (1 - np.exp(-ka * T)) / ka)
    # ka == ke: integral of F*D*ka*t*exp(-ke t)/V from 0..T
    limit = fd * ka / v * (1 - np.exp(-ke * T) * (1 + ke * T)) / ke**2
    return np.where(close, limit, general)


def half_life_hours(volume_l: float, clearance_l_per_h: float) -> float:
    return LN2 * volume_l / clearance_l_per_h


def relative_exposure(auc_base: float, auc_alt: float):
    """(AUC_alt / AUC_base, percent change) or (None, None) when the baseline AUC is 0."""
    if auc_base <= 0:
        return None, None
    ratio = auc_alt / auc_base
    return ratio, (ratio - 1.0) * 100.0
