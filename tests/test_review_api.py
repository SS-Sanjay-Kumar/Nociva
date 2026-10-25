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
