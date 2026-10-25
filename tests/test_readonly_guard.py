import base64
import json

import pytest

from app.repositories import supabase_readonly as mod


def fake_jwt(role):
    enc = lambda d: base64.urlsafe_b64encode(json.dumps(d).encode()).decode().rstrip("=")
    return f"{enc({'alg': 'none'})}.{enc({'role': role})}.sig"


# All keys below are FAKE test values.
def test_is_privileged_key():
    assert mod.is_privileged_key("sb_secret_FAKEKEY123")
    assert mod.is_privileged_key(fake_jwt("service_role"))
    assert not mod.is_privileged_key(fake_jwt("anon"))
    assert not mod.is_privileged_key("sb_publishable_FAKEKEY123")
    assert not mod.is_privileged_key("not.a.jwt!!")
    assert not mod.is_privileged_key("")


@pytest.mark.parametrize("key", ["sb_secret_FAKEKEY123", fake_jwt("service_role")])
def test_privileged_key_refused_without_key_in_message(monkeypatch, key):
    monkeypatch.setenv("SUPABASE_URL", "https://example.invalid")
    monkeypatch.setenv("SUPABASE_KEY", key)
    monkeypatch.delenv("ALLOW_PRIVILEGED_KEY", raising=False)
    with pytest.raises(RuntimeError) as exc:
        mod.make_readonly_client()
    assert str(exc.value) == "Use the publishable/anon key; this app is read-only"
    assert key not in str(exc.value)


def test_privileged_key_allowed_with_override(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.invalid")
    monkeypatch.setenv("SUPABASE_KEY", "sb_secret_FAKEKEY123")
    monkeypatch.setenv("ALLOW_PRIVILEGED_KEY", "1")
    assert mod.make_readonly_client() is not None  # builds a client object; no network call


def test_publishable_key_accepted(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://example.invalid")
    monkeypatch.setenv("SUPABASE_KEY", "sb_publishable_FAKEKEY123")
    assert mod.make_readonly_client() is not None
