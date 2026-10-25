"""Read-only literature lookup against entity_relationships (SELECT only).

Exact .eq() matches only; no ilike / or_ with caller input.
"""

from __future__ import annotations

from typing import Any, Dict, List

LIMIT = 50
COLUMNS = "entity1_name, entity2_name, association, pk, pmids"


class LiteratureRepository:
    def __init__(self, client: Any):
        self._client = client
        self._cache: Dict[tuple, List[Dict[str, Any]]] = {}

    def get_pair_rows(self, gene: str, chemical: str) -> List[Dict[str, Any]]:
        gene_name, chem_name = gene.upper(), chemical.lower()
        key = (gene_name, chem_name)
        if key not in self._cache:
            rows: List[Dict[str, Any]] = []
            for first, second in ((gene_name, chem_name), (chem_name, gene_name)):
                rows.extend(
                    self._client.from_("entity_relationships")
                    .select(COLUMNS)
                    .eq("entity1_name", first)
                    .eq("entity2_name", second)
                    .order("id")
                    .limit(LIMIT)
                    .execute()
                    .data
                )
            self._cache[key] = rows
        return self._cache[key]
