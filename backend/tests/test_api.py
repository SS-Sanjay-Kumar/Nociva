from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_model_info_shape():
    r = client.get("/api/molecular/model-info")
    assert r.status_code == 200
    body = r.json()
    assert "trained" in body
    assert "fingerprint" in body
    assert body["fingerprint"]["nBits"] == 2048


def test_analyze_valid_smiles():
    r = client.post("/api/molecular/analyze", json={"smiles": "CC(=O)Oc1ccccc1C(=O)O"})
    assert r.status_code == 200
    body = r.json()
    assert body["valid"] is True
    assert body["canonicalSmiles"]
    assert len(body["neighbors"]) == 5
    assert "cyp2d6" in body
    assert body["error"] is None
    # Additive fields for the Molecular Explorer query-structure card.
    assert body["queryImageBase64"]
    assert body["molecularFormula"] == "C9H8O4"
    assert body["molecularWeight"] > 0
    assert body["maxSimilarity"] == body["neighbors"][0]["tanimotoSimilarity"]
    # Additive provenance fields for the method line / model evaluation panel.
    assert body["provenance"]["fingerprint"]["nBits"] == 2048
    assert body["provenance"]["referenceSetSize"] > 0
    assert body["provenance"]["reportingThreshold"] == 0.30


def test_analyze_below_reporting_threshold_returns_empty_neighbors_with_max_similarity():
    # [Xe] (xenon) has ~0.03 max Tanimoto similarity to the reference set,
    # well below the 0.30 reporting threshold.
    r = client.post("/api/molecular/analyze", json={"smiles": "[Xe]"})
    assert r.status_code == 200
    body = r.json()
    assert body["valid"] is True
    assert body["neighbors"] == []
    assert body["maxSimilarity"] is not None
    assert body["maxSimilarity"] < body["provenance"]["reportingThreshold"]


def test_analyze_invalid_smiles():
    r = client.post("/api/molecular/analyze", json={"smiles": "not-a-smiles((("})
    assert r.status_code == 200
    body = r.json()
    assert body["valid"] is False
    assert body["canonicalSmiles"] is None
    assert body["neighbors"] == []
    assert body["error"]


def test_analyze_empty_smiles_rejected():
    r = client.post("/api/molecular/analyze", json={"smiles": ""})
    assert r.status_code == 422


def test_analyze_oversized_smiles_rejected():
    r = client.post("/api/molecular/analyze", json={"smiles": "C" * 600})
    assert r.status_code == 422


def test_analyze_duplicate_requests_are_consistent():
    r1 = client.post("/api/molecular/analyze", json={"smiles": "CCO"})
    r2 = client.post("/api/molecular/analyze", json={"smiles": "CCO"})
    assert r1.json()["canonicalSmiles"] == r2.json()["canonicalSmiles"]
    assert r1.json()["cyp2d6"]["prediction"]["rawScore"] == r2.json()["cyp2d6"]["prediction"]["rawScore"]
