import math

import numpy as np
import pytest
from scipy.integrate import solve_ivp

from app.models.pk import SimulateRequest
from app.services.pk.metrics import auc_analytic, auc_trapezoid, cmax_tmax, half_life_hours
from app.services.pk.model import concentration, time_grid
from app.services.pk.presets import PRESETS
from app.services.pk.service import interpret, simulate

# Synthetic spec example values.
D, F, V, CL, KA, T = 100.0, 0.8, 50.0, 10.0, 1.2, 24.0


def curve(cl=CL, v=V, ka=KA, dose=D, duration=T):
    t = time_grid(duration)
    return t, concentration(t, dose, F, v, cl, ka)


def req(**over):
    base = {**PRESETS[0]["request"], "monteCarlo": {"enabled": False}}
    base.update(over)
    return SimulateRequest(**base)


def test_time_grid_step_and_cap():
    assert len(time_grid(24)) == 481 and abs(time_grid(24)[1] - 0.05) < 1e-12
    assert len(time_grid(168)) == 2001 and time_grid(168)[-1] == 168


def test_concentration_nonnegative_and_starts_at_zero():
    t, c = curve()
    assert (c >= 0).all() and c[0] == 0


def test_zero_dose_gives_zeros():
    r = simulate(req(doseMg=0))
    assert set(r.baseline.concentration_mg_per_l) == {0.0}
    assert r.baseline.metrics.cmax_mg_per_l == 0 and r.baseline.metrics.auc_mg_h_per_l == 0
    assert r.altered.relative_exposure.auc_ratio is None


def test_lower_clearance_raises_auc_and_delays_tmax():
    r = simulate(req(comparison={"clearanceMultiplier": 0.5, "label": "x"}))
    assert r.altered.metrics.auc_mg_h_per_l > r.baseline.metrics.auc_mg_h_per_l
    assert r.altered.metrics.tmax_h >= r.baseline.metrics.tmax_h


def test_higher_clearance_lowers_auc():
    r = simulate(req(comparison={"clearanceMultiplier": 2.0, "label": "x"}))
    assert r.altered.metrics.auc_mg_h_per_l < r.baseline.metrics.auc_mg_h_per_l


def test_closed_form_matches_ode_solution():
    ke = CL / V

    def rhs(_t, y):
        gut, central = y
        return [-KA * gut, KA * gut - ke * central]

    t = time_grid(T)
    sol = solve_ivp(rhs, (0, T), [F * D, 0.0], t_eval=t, rtol=1e-10, atol=1e-12, method="LSODA")
    ode = sol.y[1] / V
    assert np.allclose(concentration(t, D, F, V, CL, KA), ode, rtol=1e-6, atol=1e-9)


def test_trapezoid_auc_matches_analytic():
    t, c = curve()
    assert math.isclose(float(auc_trapezoid(t, c)), float(auc_analytic(D, F, V, CL, KA, T)), rel_tol=1e-3)
    ke = CL / V
    # FD*ka/(V(ka-ke)): the ka factor follows from integrating C(t); omitting it disagrees with the curve.
    formula = (F * D * KA / (V * (KA - ke))) * ((1 - math.exp(-ke * T)) / ke - (1 - math.exp(-KA * T)) / KA)
    assert math.isclose(float(auc_analytic(D, F, V, CL, KA, T)), formula, rel_tol=1e-12)
    ke_eq = CL / V  # ka == ke limit branch agrees with the trapezoid too
    t, c = curve(ka=ke_eq)
    assert math.isclose(float(auc_trapezoid(t, c)), float(auc_analytic(D, F, V, CL, ke_eq, T)), rel_tol=1e-3)


def test_half_life():
    assert math.isclose(half_life_hours(V, CL), 0.693 * V / CL, rel_tol=1e-3)
    assert math.isclose(simulate(req()).baseline.metrics.half_life_h, 0.693 * V / CL, rel_tol=1e-3)


def test_cmax_tmax_match_curve_peak():
    t, c = curve()
    cmax, tmax = cmax_tmax(D, F, V, CL, KA, T)
    assert math.isclose(float(cmax), float(c.max()), rel_tol=0.01)
    assert abs(float(tmax) - float(t[c.argmax()])) <= 0.01 * max(float(tmax), 1) + 0.05  # grid resolution


@pytest.mark.parametrize("delta", [0.0, 1e-12, -1e-12, 1e-7])
def test_ka_equals_ke_is_finite_and_continuous(delta):
    ke = CL / V
    t = time_grid(T)
    exact = concentration(t, D, F, V, CL, ke + delta)
    assert np.isfinite(exact).all()
    near = concentration(t, D, F, V, CL, ke * (1 + 1e-4))
    assert np.allclose(exact, near, rtol=1e-3, atol=1e-6)
    cmax, tmax = cmax_tmax(D, F, V, CL, ke + delta, T)
    assert math.isfinite(float(cmax)) and 0 <= float(tmax) <= T
    assert math.isclose(float(tmax), 1 / ke, rel_tol=1e-3)


def test_tmax_clamped_to_window():
    _, tmax = cmax_tmax(D, F, V, 0.1, KA, 1.0)  # slow elimination -> peak beyond 1 h window
    assert float(tmax) == 1.0 or float(tmax) <= 1.0


def test_reproducible():
    assert simulate(req()).model_dump_json() == simulate(req()).model_dump_json()


def test_altered_is_always_hypothetical_with_user_label():
    r = simulate(req(comparison={"alteredClearanceLPerH": 5, "label": "My label"}))
    assert r.altered.hypothetical is True and r.altered.label == "My label"
    assert r.altered.clearance_l_per_h == 5 and r.baseline.hypothetical is False


def test_contextual_inputs_do_not_change_numbers_and_are_echoed():
    plain = simulate(req())
    ctx = simulate(req(contextual={"ageYears": 80, "weightKg": 40, "egfr": 20, "cypPhenotype": "poor_metabolizer", "concomitantMedication": "x"}))
    a, b = plain.model_dump(), ctx.model_dump()
    assert b.pop("contextual")["note"] == "Contextual information only; not used in the calculation"
    a.pop("contextual")
    assert a == b


def test_interpretation_direction_and_forbidden_words():
    assert "reducing clearance results in greater predicted drug exposure" in interpret(10, 7, 1.39)
    assert "increasing clearance results in lower predicted drug exposure" in interpret(10, 15, 0.7)
    assert "similar predicted drug exposure (within 1% AUC)" in interpret(10, 10.01, 1.005)
    for preset in PRESETS:
        r = simulate(SimulateRequest(**preset["request"]))
        text = r.interpretation.lower() + " ".join(r.assumptions + r.limitations).lower()
        for bad in ("toxic", "lethal", "safe", "recommend", "adjust the dose"):
            assert bad not in r.interpretation.lower()
        assert "not clinically validated" in text


def test_metadata_fields():
    r = simulate(req())
    assert r.model_version == "PK one-compartment v1.0" and r.validation_status == "Not clinically validated"
    assert r.provenance.synthetic is True
    assert simulate(req(doseMg=101)).provenance.synthetic is False
    assert any("Single dose" in x for x in r.limitations)
