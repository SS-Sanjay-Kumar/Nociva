import numpy as np

from app.models.pk import SimulateRequest
from app.services.pk.presets import PRESETS
from app.services.pk.service import simulate


def req(**mc):
    return SimulateRequest(**{**PRESETS[0]["request"], "monteCarlo": {"enabled": True, **mc}})


def test_reproducible_with_fixed_seed_and_differs_with_another():
    a = simulate(req(seed=7)).monte_carlo.model_dump_json()
    assert a == simulate(req(seed=7)).monte_carlo.model_dump_json()
    assert a != simulate(req(seed=8)).monte_carlo.model_dump_json()


def test_percentiles_ordered():
    mc = simulate(req()).monte_carlo
    for scenario in (mc.baseline, mc.altered):
        b = scenario.concentration_bands
        assert (np.array(b.p5) <= np.array(b.p50)).all() and (np.array(b.p50) <= np.array(b.p95)).all()
        for stat in (scenario.cmax_mg_per_l, scenario.auc_mg_h_per_l):
            assert stat.p5 <= stat.p50 <= stat.p95


def test_label_and_defaults():
    mc = simulate(req()).monte_carlo
    assert mc.label == "Assumed demonstration distributions; not a validated prediction interval."
    assert (mc.samples, mc.clearance_cv, mc.volume_cv, mc.seed) == (300, 0.30, 0.20, 42)


def test_common_random_numbers_keep_altered_above_baseline_per_percentile():
    mc = simulate(req()).monte_carlo  # altered has lower clearance, same draws
    assert mc.altered.auc_mg_h_per_l.p50 > mc.baseline.auc_mg_h_per_l.p50
    assert mc.altered.auc_mg_h_per_l.p5 > mc.baseline.auc_mg_h_per_l.p5


def test_disabled_returns_no_bands():
    r = simulate(SimulateRequest(**{**PRESETS[0]["request"], "monteCarlo": {"enabled": False}}))
    assert r.monte_carlo is None
    r2 = simulate(SimulateRequest(**{k: v for k, v in PRESETS[0]["request"].items() if k != "monteCarlo"}))
    assert r2.monte_carlo is None


def test_baseline_only_when_no_comparison():
    body = {k: v for k, v in PRESETS[0]["request"].items() if k != "comparison"}
    mc = simulate(SimulateRequest(**{**body, "monteCarlo": {"enabled": True}})).monte_carlo
    assert mc.altered is None and mc.baseline is not None
