import importlib
import sys

import pytest
from fastapi.testclient import TestClient

# Modules that load app.core.config (directly or via his routers) must be re-imported
# per test so each test sees its own environment.
RELOAD_PREFIXES = ("app.main", "app.api.v1.api", "app.api.v1.endpoints.evaluate", "app.api.v1.endpoints.search",
                   "app.api.v1.endpoints.review", "app.core", "app.repositories.guideline_repo")


def fresh_app():
    for name in [m for m in sys.modules if m.startswith(RELOAD_PREFIXES)]:
        del sys.modules[name]
    return importlib.import_module("app.main").app


@pytest.fixture(autouse=True)
def restore_modules():
    yield
    for name in [m for m in sys.modules if m.startswith(RELOAD_PREFIXES)]:
        del sys.modules[name]


def test_boots_without_env_and_serves_molecular_and_pk(monkeypatch, tmp_path, caplog):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("SUPABASE_KEY", raising=False)
    monkeypatch.chdir(tmp_path)  # empty dir: no .env can be found
    with caplog.at_level("WARNING"):
        app = fresh_app()
    assert "Supabase-backed routes disabled: .env missing" in caplog.text
    client = TestClient(app)
    assert client.get("/health").status_code == 200
    assert client.get("/api/molecular/model-info").status_code == 200
    assert client.get("/api/pk/presets").status_code == 200
    assert client.post("/api/v1/review/assess", json={}).status_code == 404
    assert client.get("/api/v1/review/medications").status_code == 404


def test_review_routes_mounted_when_env_present(monkeypatch, tmp_path):
    monkeypatch.setenv("SUPABASE_URL", "https://example.invalid")
    monkeypatch.setenv("SUPABASE_KEY", "sb_publishable_FAKEKEY123")
    monkeypatch.chdir(tmp_path)
    client = TestClient(fresh_app())
    # Mounted: an empty body fails validation (422) instead of 404, and nothing touches the network.
    assert client.post("/api/v1/review/assess", json={}).status_code == 422
    assert client.get("/api/pk/presets").status_code == 200
    assert client.get("/api/molecular/model-info").status_code == 200
