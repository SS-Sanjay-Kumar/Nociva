"""Read-only access to public.guideline_rules (SELECT only)."""

from __future__ import annotations

import json
from typing import Any, Dict, Iterable, List, Optional

PAGE_SIZE = 1000
ID_CHUNK = 50
# text_html is deliberately never selected; raw_json is fetched per matched id.
RULE_COLUMNS = "guideline_id, name, source, related_genes, related_chemicals, summary_html"


def parse_pg_array(value: Optional[str]) -> List[str]:
    """Parses '{CYP2D6,CYP2C19}' into ['cyp2d6', 'cyp2c19'] (exact tokens, lowercase)."""
    if not value:
        return []
    text = value.strip()
    if text.startswith("{") and text.endswith("}"):
        text = text[1:-1]
    return [t.strip().strip('"').strip().lower() for t in text.split(",") if t.strip().strip('"').strip()]


class GuidelineRulesRepository:
    """Fetches and caches guideline rows. `client` is any PostgREST-style client."""

    def __init__(self, client: Any):
        self._client = client
        self._rules: Optional[List[Dict[str, Any]]] = None
        self._raw: Dict[str, Optional[str]] = {}

    def get_rules(self) -> List[Dict[str, Any]]:
        if self._rules is None:
            rows: List[Dict[str, Any]] = []
            start = 0
            while True:
                page = (
                    self._client.from_("guideline_rules")
                    .select(RULE_COLUMNS)
                    .order("guideline_id")
                    .range(start, start + PAGE_SIZE - 1)
                    .execute()
                    .data
                )
                rows.extend(page)
                if len(page) < PAGE_SIZE:
                    break
                start += PAGE_SIZE
            self._rules = [
                {
                    "guideline_id": r["guideline_id"],
                    "name": r.get("name") or "",
                    "source": r.get("source") or "",
                    "summary_html": r.get("summary_html") or "",
                    "genes": parse_pg_array(r.get("related_genes")),
                    "chemicals": parse_pg_array(r.get("related_chemicals")),
                }
                for r in rows
            ]
        return self._rules

    def get_raw_json(self, guideline_ids: Iterable[str]) -> Dict[str, Optional[str]]:
        ids = sorted(set(guideline_ids))
        missing = [i for i in ids if i not in self._raw]
        for n in range(0, len(missing), ID_CHUNK):
            chunk = missing[n : n + ID_CHUNK]
            data = (
                self._client.from_("guideline_rules")
                .select("guideline_id, raw_json")
                .in_("guideline_id", chunk)
                .execute()
                .data
            )
            found = {r["guideline_id"]: r.get("raw_json") for r in data}
            for i in chunk:
                raw = found.get(i)
                self._raw[i] = raw if isinstance(raw, str) else (json.dumps(raw) if raw is not None else None)
        return {i: self._raw.get(i) for i in ids}
