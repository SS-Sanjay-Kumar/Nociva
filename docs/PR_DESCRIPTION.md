# Merge `integrate/stream1-frontend` into `dev`

## Summary

Adds the React frontend and three features to the shared FastAPI app:

1. **Medication Review**: a read-only, guideline-backed engine. It returns one
   of three verdicts (association found, no documented association,
   insufficient evidence) with quoted guideline text, versions and dates. It
   never produces a score or risk level, and "no documented association" is
   not presented as a safety finding.
2. **Molecular Explorer (Stream 1)**: an experimental CYP2D6 inhibition
   prediction and nearest-neighbour search (RandomForest on RDKit
   fingerprints), kept separate from the verdict.
3. **Pharmacokinetic Simulator (Stream 2)**: an experimental one-compartment
   oral PK model with a hypothetical altered-clearance scenario and optional
   Monte Carlo bands, using synthetic compounds only. It is not connected to
   any verdict and is not clinically validated.

## What changed

- **App layout:** Stream 1 lives in the existing `app/` layout (router
  `app/api/v1/endpoints/molecular.py`, services `app/services/molecular/`,
  schemas `app/models/molecular.py`, scripts in `ml/`, tests in `tests/`).
  Public URLs `/api/molecular/analyze` and `/api/molecular/model-info` are
  unchanged. Dependencies are merged into the root `requirements.txt`
  (`httpx` pinned to 0.25.2 to satisfy `supabase==2.3.4`; `scipy` added for
  the PK tests).
- **Review engine:** `app/services/review_engine.py`, with
  `app/repositories/guideline_rules_repo.py`, `literature_repo.py` and
  `supabase_readonly.py` (SELECT only, lazy client, refuses `sb_secret` and
  `service_role` keys unless `ALLOW_PRIVILEGED_KEY=1`), models in
  `app/models/review.py`, endpoints `GET /api/v1/review/medications` and
  `POST /api/v1/review/assess`, and a small labelled demo inhibitor list
  (`app/data/cyp_inhibitors.json`, not a clinical source). An inhibitor
  association cites only guideline rows whose text describes an enzyme
  inhibitor interaction.
- **PK Simulator:** `app/services/pk/`, `app/models/pk.py`,
  `app/api/v1/endpoints/pk.py` (`POST /api/pk/simulate`,
  `GET /api/pk/presets`), with examples in `docs/contracts/pk-examples/`.
  The altered scenario is always flagged hypothetical, and contextual inputs
  are echoed but never used in the calculation.
- **Boots without `.env`:** `app/main.py` always mounts the molecular and PK
  routers. His Supabase-backed routes (evaluate, search, and `/review`) are
  imported in a try/except and skipped with one warning, "Supabase-backed
  routes disabled: .env missing". Molecular and PK work with no `.env`; the
  live Medication Review needs `SUPABASE_URL` and `SUPABASE_KEY`.
- **Frontend:** zod contracts for review, molecular and PK (JSON schemas under
  `docs/contracts/`); live and mock modes for the review page (mock is the
  default); a lazy-loaded `#/pk` page using Recharts 3.10.1 with a data-table
  alternative; oxlint rules that stop the three features importing each other;
  a mobile navigation that keeps all three pages reachable on phones.
- **Fixes found along the way:** the primary button label was invisible (an
  unlayered CSS rule overrode `text-white`), the mobile top bar was crowded
  below 560px, and the analytic AUC formula in the PK spec lacked the `ka`
  factor (the implementation and tests use the corrected form).
- **Docs and scripts:** README, INTEGRATION.md, DEMO.md (a 3-minute script
  covering all three parts), THIRD_PARTY.md, `scripts/setup.sh`,
  `scripts/dev.sh` (live mode), `scripts/smoke_review.py`.

## How to run

```bash
printf 'SUPABASE_URL=<project url>\nSUPABASE_KEY=<publishable key>\n' > .env
./scripts/setup.sh     # venv, deps, trains the molecular model
./scripts/dev.sh       # backend :8000 + frontend in live mode
```

Without a `.env`: `uvicorn app.main:app --port 8000` serves the Molecular
Explorer and PK Simulator, and `cd frontend && npm run dev` runs the review
page on fixtures (topbar: "Demo fixtures, not a live engine").

## Test results

- `pytest tests`: 110 passed (no network or database; review tests use
  clearly labelled synthetic rows; boot-without-`.env` is tested).
- `frontend/`: `npm run build` succeeds, `npm run lint` is clean, `npm test`
  passes 119 tests in 18 files.
- Two clean clones, each running `scripts/setup.sh`:
  - without `.env`: the backend started, `/api/pk/presets`,
    `/api/pk/simulate` and `/api/molecular/analyze` answered, and
    `/api/v1/review/assess` returned 404; pytest, `npm test` and
    `npm run build` passed.
  - with `.env`: `scripts/dev.sh` in live mode returned `association_found`,
    `no_documented_association` and `insufficient_evidence` for the three
    demo scenarios.
- Full flow in a browser at 1440 px in live mode (three review scenarios,
  Molecular Explorer with aspirin, PK default preset): no console errors and
  no failed network calls.

## Not touched

- `app/api/v1/endpoints/evaluate.py`, `app/api/v1/endpoints/search.py`
- `app/services/engine.py`
- `app/repositories/guideline_repo.py`, `relation_repo.py`, `variant_repo.py`
- `app/core/config.py`, `app/core/database.py`

Edited minimally: `app/main.py` (CORS rule, router includes, the optional
legacy import) and `app/api/v1/api.py` (registers `/review`). The UI does not
use the legacy `/api/v1/evaluate` engine. Note that `supabase==2.3.4` rejects
non-JWT keys (the newer `sb_publishable_` format), so `app/core/database.py`
would fail with such a key; the review repositories use `postgrest` directly.
