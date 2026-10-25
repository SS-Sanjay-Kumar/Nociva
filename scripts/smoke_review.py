"""Live smoke test: runs the review engine against the real (read-only) tables.

Needs SUPABASE_URL and SUPABASE_KEY in the repo-root .env (or environment).
Never prints credentials. Saves request/response JSON to
docs/contracts/live-examples/. Run from the repo root: python scripts/smoke_review.py
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.repositories.supabase_readonly import load_credentials  # noqa: E402

OUT_DIR = ROOT / "docs" / "contracts" / "live-examples"

SCENARIOS = {
    "paroxetine_tamoxifen": {
        "patientId": "live-smoke-a",
        "genotypes": [
            {"gene": "CYP2D6", "phenotype": "intermediate metabolizer", "diplotype": "*1/*4", "activityScore": 1.0},
            {"gene": "CYP2C19", "phenotype": "normal metabolizer"},
            {"gene": "CYP2C9", "phenotype": "normal metabolizer"},
            {"gene": "CYP3A5", "phenotype": "non expresser"},
        ],
        "medications": [{"id": "paroxetine", "name": "Paroxetine"}, {"id": "tamoxifen", "name": "Tamoxifen"}],
    },
    "metoprolol_warfarin": {
        "patientId": "live-smoke-b",
        "genotypes": [
            {"gene": "CYP2D6", "phenotype": "normal metabolizer"},
            {"gene": "CYP2C9", "phenotype": "normal metabolizer"},
        ],
        "medications": [{"id": "metoprolol", "name": "Metoprolol"}, {"id": "warfarin", "name": "Warfarin"}],
    },
    "clopidogrel_omeprazole": {
        "patientId": "live-smoke-c",
        "genotypes": [
            {"gene": "CYP2D6", "phenotype": "normal metabolizer"},
            {"gene": "CYP2C9", "phenotype": "intermediate metabolizer"},
        ],
        "medications": [{"id": "clopidogrel", "name": "Clopidogrel"}, {"id": "omeprazole", "name": "Omeprazole"}],
    },
}


def main() -> int:
    if load_credentials() is None:
        print("skipped: no .env")
        return 0

    from app.models.review import AssessmentResult, AssessRequest
    from app.repositories.guideline_rules_repo import GuidelineRulesRepository
    from app.repositories.literature_repo import LiteratureRepository
    from app.repositories.supabase_readonly import make_readonly_client
    from app.services.review_engine import ReviewEngine

    client = make_readonly_client()
    engine = ReviewEngine(GuidelineRulesRepository(client), LiteratureRepository(client))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for name, payload in SCENARIOS.items():
        result = engine.assess(AssessRequest(**payload))
        response = AssessmentResult(
            **result, generatedAt=datetime.now(timezone.utc).isoformat(), isMock=False
        ).model_dump(exclude_none=True)
        (OUT_DIR / f"{name}.request.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        (OUT_DIR / f"{name}.response.json").write_text(
            json.dumps(response, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        v = response["verdict"]
        print(f"== {name}")
        print("  evidenceStatus:", v["evidenceStatus"])
        print("  ruleId:", v.get("ruleId"))
        print("  references.guidelineId:", [r.get("guidelineId") for r in v["references"]])
        print("  missingData:", v.get("missingData"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
