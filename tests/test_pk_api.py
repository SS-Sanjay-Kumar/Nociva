import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1.endpoints.pk import router
from app.services.pk.presets import PRESETS

# Own tiny app: only the PK router, never app.main / app.core.
app = FastAPI()
app.include_router(router)
client = TestClient(app)

BODY = PRESETS[0]["request"]
SNAKE = {
    "compound_name": "Synthetic Compound X", "route": "oral", "dose_mg": 100, "bioavailability": 0.8,
    "volume_l": 50, "clearance_l_per_h": 10, "absorption_rate_per_h": 1.2,
    "comparison": {"clearance_multiplier": 0.7, "label": "Hypothetical"},
}


def test_simulate_camel_case_response():
    r = client.post("/api/pk/simulate", json=BODY)
    assert r.status_code == 200
    d = r.json()
    assert d["modelVersion"] == "PK one-compartment v1.0"
    assert d["baseline"]["metrics"]["aucMgHPerL"] > 0
    assert d["altered"]["hypothetical"] is True
    assert "monteCarlo" not in d  # disabled: no bands
    assert d["units"]["concentration"] == "mg/L" and d["validationStatus"] == "Not clinically validated"
    assert d["durationHours"] == 24


def test_snake_case_request_also_works():
    a = client.post("/api/pk/simulate", json=SNAKE)
    assert a.status_code == 200
    b = client.post("/api/pk/simulate", json={**BODY, "comparison": {"clearanceMultiplier": 0.7, "label": "Hypothetical"}})
    assert a.json()["baseline"] == b.json()["baseline"]


def test_monte_carlo_enabled_returns_bands():
    r = client.post("/api/pk/simulate", json={**BODY, "monteCarlo": {"enabled": True, "samples": 100}})
    d = r.json()["monteCarlo"]
    assert set(d["baseline"]["concentrationBands"]) == {"p5", "p50", "p95"} and d["samples"] == 100


@pytest.mark.parametrize("field,value", [
    ("doseMg", -1), ("doseMg", 10001), ("bioavailability", 0), ("bioavailability", 1.1),
    ("volumeL", 0), ("volumeL", -5), ("clearanceLPerH", 0), ("clearanceLPerH", -1),
    ("absorptionRatePerH", 0), ("durationHours", 0), ("durationHours", 169), ("route", "iv"),
])
def test_invalid_parameters_are_422_with_readable_message(field, value):
    r = client.post("/api/pk/simulate", json={**BODY, field: value})
    assert r.status_code == 422
    detail = r.json()["detail"][0]
    assert field in detail["loc"] and detail["msg"]


@pytest.mark.parametrize("cmp", [
    {"label": "x"},
    {"clearanceMultiplier": 0.5, "alteredClearanceLPerH": 5, "label": "x"},
    {"clearanceMultiplier": 0.05, "label": "x"},
    {"clearanceMultiplier": 11, "label": "x"},
    {"alteredClearanceLPerH": 0, "label": "x"},
])
def test_invalid_comparison_is_422(cmp):
    assert client.post("/api/pk/simulate", json={**BODY, "comparison": cmp}).status_code == 422


@pytest.mark.parametrize("mc", [{"enabled": True, "samples": 49}, {"enabled": True, "samples": 1001}])
def test_invalid_monte_carlo_is_422(mc):
    assert client.post("/api/pk/simulate", json={**BODY, "monteCarlo": mc}).status_code == 422


def test_presets_are_fictional_and_valid():
    r = client.get("/api/pk/presets")
    assert r.status_code == 200
    presets = r.json()
    assert [p["request"]["compoundName"] for p in presets] == [f"Synthetic Compound {x}" for x in "XYZ"]
    for p in presets:
        assert client.post("/api/pk/simulate", json=p["request"]).status_code == 200
        assert "Synthetic" in p["description"]
    x = presets[0]["request"]
    assert (x["doseMg"], x["bioavailability"], x["volumeL"], x["clearanceLPerH"], x["absorptionRatePerH"]) == (100, 0.8, 50, 10, 1.2)
    assert x["comparison"]["clearanceMultiplier"] == 0.7


def test_pk_modules_do_not_import_core_or_network():
    import pathlib, re
    root = pathlib.Path(__file__).resolve().parents[1]
    for f in list((root / "app/services/pk").glob("*.py")) + [root / "app/models/pk.py", root / "app/api/v1/endpoints/pk.py"]:
        src = f.read_text()
        assert not re.search(r"^\s*(from|import)\s+(app\.core|supabase|requests|httpx|postgrest)", src, re.M), f
