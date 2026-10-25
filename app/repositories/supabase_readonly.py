"""Lazy, read-only PostgREST client for the review engine.

Built on demand (never at import time) so tests and tooling run without a
.env. Only the query builder's .select() is used by callers; this module
never writes. Uses postgrest directly so any Supabase key format works.
"""

from __future__ import annotations

import base64
import json
import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def load_credentials() -> tuple[str, str] | None:
    """Returns (url, key) from the environment or the repo-root .env, else None."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_KEY")
    if not (url and key):
        env_file = REPO_ROOT / ".env"
        if env_file.is_file():
            from dotenv import dotenv_values

            values = dotenv_values(env_file)
            url = url or values.get("SUPABASE_URL")
            key = key or values.get("SUPABASE_KEY")
    if url and key:
        return url.strip().rstrip("/"), key.strip()
    return None


PRIVILEGED_KEY_MESSAGE = "Use the publishable/anon key; this app is read-only"


def is_privileged_key(key: str) -> bool:
    """True for an sb_secret key or a JWT whose role claim is service_role."""
    if key.startswith("sb_secret"):
        return True
    parts = key.split(".")
    if len(parts) == 3:
        try:
            payload = parts[1] + "=" * (-len(parts[1]) % 4)
            return json.loads(base64.urlsafe_b64decode(payload)).get("role") == "service_role"
        except Exception:
            return False
    return False


def make_readonly_client():
    creds = load_credentials()
    if creds is None:
        raise RuntimeError("SUPABASE_URL / SUPABASE_KEY are not configured")
    # The message never includes the key.
    if is_privileged_key(creds[1]) and os.environ.get("ALLOW_PRIVILEGED_KEY") != "1":
        raise RuntimeError(PRIVILEGED_KEY_MESSAGE)
    from postgrest import SyncPostgrestClient

    url, key = creds
    return SyncPostgrestClient(f"{url}/rest/v1", headers={"apikey": key, "Authorization": f"Bearer {key}"})
