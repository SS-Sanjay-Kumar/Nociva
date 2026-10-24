# GeneCollision

Monorepo for the GeneCollision hackathon project: a patient's pharmacogenetic
profile checked against their medications, plus a separate experimental
molecular-similarity and CYP2D6-inhibition tool.

```
GeneCollision/
  backend/     FastAPI backend (Python)
    app/
      main.py            Minimal scaffold entry point — see "What's real" below
      routers/molecular.py        Stream 1 API router
      services/molecular/         Fingerprinting, similarity search, classifier inference
      schemas/molecular.py        Pydantic request/response models
    ml/        Dataset prep, training, reference-index build scripts
    models/    Trained artifacts (gitignored — regenerate, don't commit)
    tests/     pytest suite (27 tests)
  frontend/    React + TypeScript + Vite + Tailwind frontend
    src/
      features/review/      Medication Review (mock-mode feature)
      features/molecular/   Molecular Explorer (live-API feature)
      components/ui/        Shared design-system primitives
      components/shell/     Sidebar, Topbar, Footer
  INTEGRATION.md   API contracts, both implemented and expected
  DEMO.md          2-minute demo script
```

`features/review` and `features/molecular` never import from each other
(enforced by an oxlint `no-restricted-imports` rule) — the only bridge
between them is a plain navigation link.

## What's real vs. what's mocked

| Area | Status |
|---|---|
| **Medication Review** | Frontend only, running against **typed mock fixtures** (`frontend/src/features/review/mocks/`). No backend call is made. Every result is labelled a demonstration fixture. The deterministic rule-engine backend this page expects does not exist yet — see INTEGRATION.md §3 for the contract a teammate needs to implement. |
| **Molecular Explorer** | **Live** against the local FastAPI service: real RDKit validation/canonicalisation/2D rendering, real Tanimoto similarity search over the classifier's full 10,504-compound **training split** (not a sample — see below), and a real scikit-learn RandomForestClassifier trained on TDC CYP2D6_Veith. Nothing here is faked; if the backend is down or the model isn't trained, the UI says so explicitly instead of inventing a result. |
| **`backend/app/main.py`** | A **minimal stand-in**, not a competing backend — it existed only because no backend file existed yet when Stream 1 started. It wires up CORS, `/health`, and `app.include_router(molecular_router)`. The teammate's Supabase-backed backend should replace or absorb this file; see INTEGRATION.md §1 for the two-line merge. |

## Prerequisites

- Node.js 20+ and npm
- Python 3.12 (a virtualenv is used; no system-wide installs required)

## Backend: setup, train, and run

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# One-time: download TDC CYP2D6_Veith (CC BY 4.0) and train the classifier.
# This downloads data to ~/scikit_learn_data and writes artifacts to backend/models/.
python ml/train_cyp2d6_model.py

# One-time: build the Tanimoto similarity reference index — this is the
# classifier's own training split (same scaffold split, same compounds),
# not a separate sample, so "similar to training data" means exactly that.
python ml/build_reference_index.py

# Run the API
uvicorn app.main:app --reload --port 8000
```

Verify it's up:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/molecular/model-info
```

### Run backend tests

```bash
cd backend
source .venv/bin/activate
python -m pytest tests/ -v
```

All 27 tests cover: fingerprint validity/reproducibility, data cleaning (invalid SMILES,
duplicates, conflicting labels), Tanimoto similarity (including the reporting-threshold
empty-neighbours case and training-set membership flagging), scaffold train/val/test
separation, classifier loading/inference determinism, and the HTTP API (valid/invalid/
empty/oversized input, response shape, idempotency).

## Frontend: setup and run

```bash
cd frontend
npm install
cp .env.example .env.local   # defaults to http://localhost:8000 for the backend
npm run dev
```

Open http://localhost:5173.

### Environment variables (`.env.local`, see `.env.example`)

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL the central API client calls (both features). |
| `VITE_REVIEW_MODE` | `mock` | `mock` (default) serves typed fixtures for Medication Review; `live` calls `/api/patients`, `/api/medications`, `/api/assessments` per INTEGRATION.md §3. |

### Frontend checks

```bash
cd frontend
npm run build   # TypeScript + Vite production build
npm run lint    # oxlint, including the feature-isolation rule
npm test        # Vitest + React Testing Library
```

## Dataset & licensing

- **TDC CYP2D6_Veith** (Veith et al., Nature Biotechnology 2009), distributed via
  Therapeutics Data Commons, licensed **CC BY 4.0**. Loaded with
  `skfp.datasets.tdc.adme.load_cyp2d6_veith` (package `scikit-fingerprints`), which pulls
  the dataset from the TDC mirror on the Hugging Face Hub on first use and caches it
  locally under `~/scikit_learn_data`.
- No paid APIs, no paid inference, no GPU required. All ML training and inference run
  locally with scikit-learn on CPU.

## Docs

- [INTEGRATION.md](./INTEGRATION.md) — API contracts (implemented and expected), how to
  mount the Stream 1 router into the teammate's backend, how to switch Medication Review
  off mock mode.
- [DEMO.md](./DEMO.md) — a 2-minute walkthrough script.
- `docs/contracts/` — generated JSON Schema and worked examples for the
  Medication Review contract (source of truth: `frontend/src/contracts/`).
- [THIRD_PARTY.md](./THIRD_PARTY.md) — direct dependency licenses.

## Git

Work is on branch `feature/stream1-molecular-frontend`. Nothing has been pushed; push only
after review.
