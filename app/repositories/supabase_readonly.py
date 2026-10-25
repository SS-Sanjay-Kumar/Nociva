"""Lazy, read-only PostgREST client for the review engine.

Built on demand (never at import time) so tests and tooling run without a
.env. Only the query builder's .select() is used by callers; this module
never writes. Uses postgrest directly so any Supabase key format works.
"""

from __future__ import annotations

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


def make_readonly_client():
    creds = load_credentials()
    if creds is None:
        raise RuntimeError("SUPABASE_URL / SUPABASE_KEY are not configured")
    from postgrest import SyncPostgrestClient

    url, key = creds
    return SyncPostgrestClient(f"{url}/rest/v1", headers={"apikey": key, "Authorization": f"Bearer {key}"})
