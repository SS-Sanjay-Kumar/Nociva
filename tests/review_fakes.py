"""SYNTHETIC test data for the review engine. These rows are invented for
tests; they are NOT real guideline text and must never be shown as such."""

import json

from app.repositories.guideline_rules_repo import parse_pg_array


def _raw(rec=True, version=3, date="2022-02-10T13:51:37.87-08:00"):
    return json.dumps({"guideline": {"recommendation": rec, "version": version, "history": [{"date": "2020-01-01T00:00:00Z"}, {"date": date}]}})


SYNTHETIC_ROWS = [
    # (id, name, source, genes, chemicals, summary_html, raw_json)
    ("SYN1", "SYNTHETIC CPIC tamoxifen / CYP2D6", "CPIC", "{CYP2D6}", "{tamoxifen}",
     "<p>SYNTHETIC: consider alternatives for CYP2D6 poor metabolizers &amp; intermediate metabolizers.</p>\n", _raw()),
    ("SYN2", "SYNTHETIC RNPGx tamoxifen / CYP2D6", "RNPGx", "{CYP2D6}", "{tamoxifen}",
     "<p>SYNTHETIC: no recommendation to genotype. poor intermediate</p>", _raw(rec=False)),
    ("SYN3", "SYNTHETIC CPIC paroxetine / CYP2D6", "CPIC", "{CYP2D6}", "{paroxetine}",
     "<p>SYNTHETIC: CYP2D6 poor metabolizers may need a lower dose.</p>", _raw(version=5, date="2023-05-01T00:00:00Z")),
    ("SYN4", "SYNTHETIC CPIC metoprolol / CYP2D6", "CPIC", "{CYP2D6}", "{metoprolol}",
     "<p>SYNTHETIC: poor metabolizers and ultrarapid metabolizers.</p>", _raw()),
    ("SYN5", "SYNTHETIC CPIC warfarin / CYP2C9", "CPIC", "{CYP2C9,CYP4F2}", "{warfarin}",
     "<p>SYNTHETIC: CYP2C9 poor metabolizers.</p>", _raw()),
    ("SYN6", "SYNTHETIC CPIC clopidogrel / CYP2C19", "CPIC", "{CYP2C19}", "{clopidogrel}",
     "<p>SYNTHETIC: CYP2C19 poor metabolizers and intermediate metabolizers.</p>", _raw()),
    ("SYN7", "SYNTHETIC CPIC omeprazole / CYP2C19", "CPIC", "{CYP2C19}", "{omeprazole}",
     "<p>SYNTHETIC: CYP2C19 ultra-rapid metabolizers; rapid metabolizers.</p>", _raw()),
    ("SYN8", "SYNTHETIC dihydrocodeine / CYP2D6", "CPIC", "{CYP2D6}", "{dihydrocodeine}",
     "<p>SYNTHETIC: poor metabolizers.</p>", _raw()),
    ("SYN9", "SYNTHETIC unsupported gene row", "CPIC", "{TPMT}", "{azathioprine}",
     "<p>SYNTHETIC: poor metabolizers.</p>", _raw()),
    ("SYN10", "SYNTHETIC malformed raw_json row", "CPIC", "{CYP2D6}", "{codeine}",
     "<p>SYNTHETIC: poor metabolizers.</p>", "{not json"),
]


class FakeRulesRepo:
    def __init__(self, rows=SYNTHETIC_ROWS):
        self._rows = rows
        self.raw_requests = []

    def get_rules(self):
        return [
            {"guideline_id": i, "name": n, "source": s, "summary_html": h, "genes": parse_pg_array(g), "chemicals": parse_pg_array(c)}
            for i, n, s, g, c, h, _ in self._rows
        ]

    def get_raw_json(self, ids):
        ids = sorted(set(ids))
        self.raw_requests.append(ids)
        raw = {r[0]: r[6] for r in self._rows}
        return {i: raw.get(i) for i in ids}


class FakeLiteratureRepo:
    def __init__(self, rows_by_pair=None, raises=False):
        self.rows = rows_by_pair or {}
        self.raises = raises

    def get_pair_rows(self, gene, chemical):
        if self.raises:
            raise RuntimeError("boom")
        return self.rows.get((gene.upper(), chemical.lower()), [])
