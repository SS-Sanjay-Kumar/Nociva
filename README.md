# GeneCollision

Monorepo for the GeneCollision hackathon project.

```
GeneCollision/
  backend/     FastAPI backend (Python)
  frontend/    React + TypeScript + Vite + Tailwind frontend
```

This branch (`feature/stream1-molecular-frontend`) contains:
- The full frontend (Medication Review UI in demonstration/mock mode, Molecular Explorer UI)
- **Stream 1: Molecular Intelligence Engine** — RDKit similarity search + a locally-trained
  scikit-learn CYP2D6 inhibition classifier, exposed as an independent FastAPI router

See [INTEGRATION.md](./INTEGRATION.md) for the API contract and how a teammate's
Supabase-backed backend should merge with this work.

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

# One-time: build the Tanimoto similarity reference index.
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

All 23 tests cover: fingerprint validity/reproducibility, data cleaning (invalid SMILES,
duplicates, conflicting labels), Tanimoto similarity, scaffold train/val/test separation,
classifier loading/inference determinism, and the HTTP API (valid/invalid/empty/oversized
input, response shape, idempotency).

## Frontend: setup and run

```bash
cd frontend
npm install
cp .env.example .env.local   # defaults to http://localhost:8000 for the backend
npm run dev
```

Open http://localhost:5173.

- **Medication Review** — always runs in clearly-labelled mock mode (synthetic patients,
  hand-authored evidence fixtures). Works with or without any backend running.
- **Molecular Explorer** — calls the local FastAPI service above. If the backend isn't
  running or the model isn't trained yet, the page shows an explicit unavailable/untrained
  state rather than fabricating results.

### Frontend build check

```bash
cd frontend
npm run build
```

## Dataset & licensing

- **TDC CYP2D6_Veith** (Veith et al., Nature Biotechnology 2009), distributed via
  Therapeutics Data Commons, licensed **CC BY 4.0**. Loaded with
  `skfp.datasets.tdc.adme.load_cyp2d6_veith` (package `scikit-fingerprints`), which pulls
  the dataset from the TDC mirror on the Hugging Face Hub on first use and caches it
  locally under `~/scikit_learn_data`.
- No paid APIs, no paid inference, no GPU required. All ML training and inference run
  locally with scikit-learn on CPU.

## Git

Work is on branch `feature/stream1-molecular-frontend`. Nothing has been pushed; push only
after review.
