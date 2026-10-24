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
