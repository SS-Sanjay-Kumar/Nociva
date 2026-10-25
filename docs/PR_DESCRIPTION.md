# Merge `integrate/stream1-frontend` into `dev`

## Summary

Adds the React frontend, the Molecular Explorer (Stream 1) and a new
read-only, guideline-backed Medication Review engine to the shared FastAPI
app, and wires the UI to it. The engine returns one of three verdicts
(association found, no documented association, insufficient evidence) with
quoted guideline text, versions and dates. It never produces a score or risk
level, and "no documented association" is not presented as a safety finding.

## What changed

- **App layout:** Stream 1 moved into the existing `app/` layout (router in
  `app/api/v1/endpoints/molecular.py`, services in `app/services/molecular/`,
  schemas in `app/models/molecular.py`, scripts in `ml/`, tests in `tests/`).
  Public URLs `/api/molecular/analyze` and `/api/molecular/model-info` are
  unchanged. Our dependencies are merged into the root `requirements.txt`
  (`httpx` is pinned to 0.25.2 to satisfy `supabase==2.3.4`).
- **Review engine:** `app/services/review_engine.py`, with
  `app/repositories/guideline_rules_repo.py`, `literature_repo.py` and
  `supabase_readonly.py` (SELECT only, lazy client, refuses `sb_secret` /
  `service_role` keys unless `ALLOW_PRIVILEGED_KEY=1`), models in
  `app/models/review.py`, endpoints `GET /api/v1/review/medications` and
  `POST /api/v1/review/assess`, and a small labelled demo inhibitor list
  (`app/data/cyp_inhibitors.json`, not a clinical source).
- **Frontend:** live adapter (`VITE_REVIEW_MODE=live`) with debounced,
  abortable medication search and zod-validated responses; mock mode stays
  the default. Evidence cards show source, annotation version, date and the
  quoted guideline text; a "Background reading (PubMed)" line links related
  literature with its status.
- **Fixes found along the way:** the primary button label was invisible
  (an unlayered CSS rule overrode `text-white`), and the mobile top bar was
  crowded below 560px.
- **`app/main.py`:** one CORS rule (any `http://localhost:<port>` or
  `http://127.0.0.1:<port>`) and the molecular router include. `app/api/v1/api.py`
  registers the review router under `/review`.
- **Docs and scripts:** README, INTEGRATION.md, DEMO.md (including a
  3-minute live script), THIRD_PARTY.md, `scripts/setup.sh`, `scripts/dev.sh`,
  `scripts/smoke_review.py`, and example requests/responses in
  `docs/contracts/`.

## How to run

```bash
printf 'SUPABASE_URL=<project url>\nSUPABASE_KEY=<publishable key>\n' > .env
./scripts/setup.sh     # venv, deps, trains the molecular model
./scripts/dev.sh       # backend :8000 + frontend in live mode
```

Mock mode (no backend or `.env`): `cd frontend && npm install && npm run dev`.

## Test results

- `pytest tests`: 59 passed (no network or database needed; the review tests
  use clearly labelled synthetic rows).
- `frontend/`: `npm run build` succeeds, `npm run lint` is clean, `npm test`
  passes 75 tests in 14 files.
- Live check against the real tables with a publishable key: the three demo
  scenarios return `association_found`, `no_documented_association` and
  `insufficient_evidence`. Mock mode was re-checked in a browser: topbar chip,
  verdict labels and console are clean. A clean clone ran `setup.sh`,
  `dev.sh`, the live API calls and both test suites.

## Not touched

- `app/api/v1/endpoints/evaluate.py`, `app/api/v1/endpoints/search.py`
- `app/services/engine.py`
- `app/repositories/guideline_repo.py`, `relation_repo.py`, `variant_repo.py`
- `app/core/config.py`, `app/core/database.py`

The UI does not use the legacy `/api/v1/evaluate` engine. Note that
`supabase==2.3.4` rejects non-JWT keys (the newer `sb_publishable_` format),
so `app/core/database.py` would fail with such a key. The review repositories
avoid this by using `postgrest` directly.
