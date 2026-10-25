from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.v1.endpoints.review import engine_dependency, router
from app.services.review_engine import ReviewEngine
from tests.review_fakes import FakeRulesRepo

app = FastAPI()
app.include_router(router, prefix="/api/v1/review")
app.dependency_overrides[engine_dependency] = lambda: ReviewEngine(FakeRulesRepo())
client = TestClient(app)


def test_assess_camel_case_shape():
    r = client.post("/api/v1/review/assess", json={
        "patientId": "p1",
        "genotypes": [{"gene": "CYP2D6", "phenotype": "intermediate_metabolizer", "diplotype": "*1/*4", "activityScore": 1.0}],
        "medications": [{"id": "tamoxifen", "name": "Tamoxifen"}],
    })
    assert r.status_code == 200
    body = r.json()
    assert body["isMock"] is False and body["patientId"] == "p1"
    v = body["verdict"]
    assert v["evidenceStatus"] == "association_found"
    assert v["references"][0]["guidelineId"] == "SYN1"
    assert "recommendation" not in v  # exclude_none


def test_medications_endpoint():
    r = client.get("/api/v1/review/medications", params={"query": "tam"})
    assert r.json() == [{"id": "tamoxifen", "name": "Tamoxifen"}]


# ---- GET /genes (rows below are SYNTHETIC, not real guideline data) ----

from pathlib import Path

from app.api.v1.endpoints import review as review_module
from app.services import review_engine as engine_module
from tests.review_fakes import _raw


def _genes_client(rows):
    a = FastAPI()
    a.include_router(router, prefix="/api/v1/review")
    a.dependency_overrides[engine_dependency] = lambda: ReviewEngine(FakeRulesRepo(rows))
    return TestClient(a)


def test_genes_returns_only_supported_genes_with_qualifying_rows():
    r = client.get("/api/v1/review/genes")
    assert r.status_code == 200
    # SYN10 (malformed raw_json) does not qualify; SYN2 is recommendation=false.
    assert r.json() == [
        {"gene": "CYP2C19", "guidelineCount": 2},
        {"gene": "CYP2C9", "guidelineCount": 1},
        {"gene": "CYP2D6", "guidelineCount": 5},
    ]


def test_genes_ignores_unsupported_and_non_recommendation_rows():
    rows = [
        ("S1", "SYNTHETIC", "CPIC", "{TPMT,CYP4F2}", "{x}", "<p>SYNTHETIC</p>", _raw()),
        ("S2", "SYNTHETIC", "CPIC", "{CYP3A5}", "{y}", "<p>SYNTHETIC</p>", _raw(rec=False)),
        ("S3", "SYNTHETIC", "CPIC", "{CYP2C9}", "{z}", "<p>SYNTHETIC</p>", _raw()),
    ]
    assert _genes_client(rows).get("/api/v1/review/genes").json() == [{"gene": "CYP2C9", "guidelineCount": 1}]


def test_genes_empty_repo_returns_empty_list():
    assert _genes_client([]).get("/api/v1/review/genes").json() == []


def test_genes_path_has_no_network_or_core_import():
    for mod in (review_module, engine_module):
        src = Path(mod.__file__).read_text()
        assert "app.core" not in src
        assert "requests" not in src and "httpx" not in src
