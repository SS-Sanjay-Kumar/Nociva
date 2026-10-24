# Integration Guide

This document is for whoever owns the shared FastAPI backend and Supabase
database, and for connecting the frontend to the real Medication Review
backend contract once it exists.

## 1. Mounting the Stream 1 router into the real app

`backend/app/main.py` in this branch is a **minimal scaffold** created only
because no backend file existed yet on this branch. It is not a competing
backend — it exists to make Stream 1 runnable in isolation.

If you already have (or are building) `backend/app/main.py` with Supabase
wiring, routes, etc., do **not** let this branch overwrite it. Instead, pull
in two things from this branch:

1. `backend/app/routers/molecular.py` and everything under
   `backend/app/services/molecular/` — fully self-contained, no shared-state
   dependencies.
2. One include line in your `main.py`:

```python
from app.routers.molecular import router as molecular_router
app.include_router(molecular_router)
```

That's the entire integration surface. The molecular router:
- Does not import or touch Supabase, your database connections, or any
  other router's state.
- Reads its own artifacts from `backend/models/` (produced by
  `backend/ml/train_cyp2d6_model.py` and `backend/ml/build_reference_index.py`).
- Only needs CORS to allow the local frontend dev origin
  (`http://localhost:5173`) — merge that into your existing `CORSMiddleware`
  config if you already have one, rather than adding a second middleware.

If `backend/app/main.py` already exists with different content by the time
this merges, **do not overwrite it** — apply only the two additions above as
a patch.

## 2. Stream 1 API contract (implemented, live)

### `GET /health`
```json
{ "status": "ok" }
```

### `GET /api/molecular/model-info`
Returns classifier metadata and, once trained, real measured evaluation
metrics (see `backend/models/cyp2d6_model_metadata.json` for the actual
numbers from the last training run).

```ts
interface ModelInfoResponse {
  trained: boolean
  modelType: string                 // "RandomForestClassifier"
  nEstimators?: number
  fingerprint: { type: string; radius: number; nBits: number }
  dataset: { name: string; license: string; source: string }
  metrics?: {
    auprc: number
    rocAuc: number | null
    precision: number
    recall: number
    f1: number
    confusionMatrix: number[][]
    positiveClassPrevalence: number
    nTrain: number
    nValidation: number
    nTest: number
  }
}
```

### `POST /api/molecular/analyze`

Request:
```json
{ "smiles": "CC(=O)Oc1ccccc1C(=O)O" }
```
`smiles` must be 1–500 characters (enforced by FastAPI/Pydantic — violations
return `422` automatically, no custom error handling needed on the frontend
beyond catching non-2xx).

Response (`200`, valid input):
```ts
interface MolecularAnalyzeResponse {
  inputSmiles: string
  canonicalSmiles: string | null   // null only if valid === false
  valid: boolean
  neighbors: {
    identifier: string             // e.g. "CYP2D6_Veith#846" — dataset has no compound names
    smiles: string
    canonicalSmiles: string
    tanimotoSimilarity: number      // 0..1
    imageBase64: string | null      // PNG, base64, no data: prefix
  }[]                                // always length 5 when valid
  cyp2d6: {
    modelTrained: boolean
    prediction?: {
      predictedClass: "inhibitor" | "non_inhibitor"
      rawScore: number              // uncalibrated model score, not a probability
      scoreCalibrated: boolean      // always false currently
      applicabilityWarning?: string | null
    }
  }
  provenance: { dataset: string; license: string; method: string }
  limitations: string[]
  error: string | null
}
```

Response when `valid: false` (RDKit could not parse the input): `neighbors`
is `[]`, `canonicalSmiles` is `null`, `error` explains why. Still HTTP `200`
— this is a normal "unsupported input" result, not a server error.

## 3. Medication Review: current state and backend contract needed

The Medication Review page (`frontend/src/pages/MedicationReviewPage.tsx`) is
**fully built against mock fixtures** (`frontend/src/mocks/*.ts`) because no
deterministic rule-engine backend contract exists yet. It never computes a
clinical verdict client-side — `frontend/src/api/medicationApi.ts` is the one
place that would change.

Expected real contract (not yet implemented server-side):

```
GET  /api/patients                       -> PatientProfile[]
GET  /api/medications?query=<string>     -> Medication[]
POST /api/assessments                    -> AssessmentResult[]
     body: { patientId: string, medicationIds: string[] }
```

Types (`frontend/src/types/index.ts`) are the authoritative shape:
`PatientProfile`, `Medication`, `AssessmentResult`, `ClinicalVerdict`,
`EvidenceStatus` (`"association_found" | "no_documented_association" |
"insufficient_evidence"`).

To switch Medication Review from mock to live once your contract exists:
1. In `frontend/src/api/medicationApi.ts`, replace the mock-returning bodies
   of `fetchPatients`, `fetchMedications`, `runAssessment` with
   `apiRequest<T>(...)` calls (the central client in `api/client.ts`).
2. Flip `MEDICATION_REVIEW_MOCK_MODE` in `frontend/src/lib/config.ts` to a
   runtime/env-driven flag instead of a hardcoded `true`.
3. No other file needs to change — pages/components consume the hook
   (`useMedicationAssessment`), not the API module directly.

**Important constraint carried over from Stream 1 design:** the CYP2D6 ML
classifier's output must never be fed into this deterministic verdict. If
your rule engine wants molecular-similarity context, call
`POST /api/molecular/analyze` separately and surface it as distinct,
clearly-labelled experimental information — not as an input to the verdict
logic.

## 4. Supabase

Nothing in this branch touches Supabase — no schema changes, no credentials,
no client code. Stream 1's model/index artifacts are flat files under
`backend/models/` (gitignored, regenerated locally via the two training
scripts in `backend/ml/`). Keep all privileged Supabase access server-side
in your routes; Stream 1 does not need Supabase access at all.

## 5. Reproducing the dataset and model locally

```bash
cd backend
source .venv/bin/activate
python ml/train_cyp2d6_model.py        # downloads TDC CYP2D6_Veith, trains, evaluates
python ml/build_reference_index.py     # builds the Tanimoto reference index
```

Both scripts are idempotent and deterministic (fixed seed = 42). Artifacts
land in `backend/models/` and are gitignored — regenerate them rather than
committing the ~44MB of binaries.
