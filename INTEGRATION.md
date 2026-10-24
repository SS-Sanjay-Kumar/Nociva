# Integration Guide

This document is for whoever owns the shared FastAPI backend and Supabase
database, and for connecting the frontend to the real Medication Review
backend contract once it exists.

## 1. Mounting the Stream 1 router into the real app

`backend/app/main.py` on this branch is a **minimal scaffold** created only
because no backend file existed yet when Stream 1 started. It is not a
competing backend — it exists to make Stream 1 runnable in isolation.

If you already have (or are building) `backend/app/main.py` with Supabase
wiring, routes, etc., do **not** let this branch overwrite it. Instead, pull
in two things from this branch:

1. `backend/app/routers/molecular.py` and everything under
   `backend/app/services/molecular/` and `backend/app/schemas/molecular.py` —
   fully self-contained, no shared-state dependencies.
2. One include line in your `main.py`:

```python
from app.routers.molecular import router as molecular_router
app.include_router(molecular_router)
```

That's the entire integration surface. The molecular router:
- Does not import or touch Supabase, your database connections, or any
  other router's state.
- Reads its own artifacts from `backend/models/` at your repo root — not
  under `app/` — produced by running, from your repo root with your venv
  active: `python ml/train_cyp2d6_model.py` then `python
  ml/build_reference_index.py` (copy `backend/ml/` over too; it's not part
  of the router but it's what generates the artifacts the router reads). If
  the artifacts aren't there yet, the router degrades gracefully —
  `GET /api/molecular/model-info` returns `trained: false`, `analyze` still
  validates/canonicalises/draws structures, just without a classifier
  prediction or similarity neighbours — rather than erroring.
- Needs these Python packages installed: `fastapi`, `rdkit`, `scikit-learn`,
  `scikit-fingerprints`, `pandas`, `numpy`, `joblib`, `pydantic`. See
  `backend/requirements.txt` for exact pinned versions (not enumerated here
  so this document doesn't drift from it).
- Only needs CORS to allow the local frontend dev origin
  (`http://localhost:5173`, or any `localhost`/`127.0.0.1` port — see
  `backend/app/main.py`'s `allow_origin_regex`) — merge that into your
  existing `CORSMiddleware` config if you already have one, rather than
  adding a second middleware. CORS is app-level, so your own policy governs
  the merged router too; there's no collision to worry about, just make
  sure your policy actually allows the frontend's origin.

**`GET /health` does NOT travel with this merge** — it's defined directly
in the scaffold's `backend/app/main.py`, not inside `routers/molecular.py`,
specifically so it stays a general app-level health check rather than
something Stream 1-specific. If you copy `backend/tests/` wholesale,
`test_api.py::test_health` will fail against your own `main.py` unless it
also exposes `GET /health` (which it almost certainly already does, or
should, independent of this merge). Verified by actually doing this merge
into a standalone throwaway FastAPI app in this session: 26 of 27 copied
tests passed unmodified against the fresh app; `test_health` was the only
failure, for exactly this reason.

If `backend/app/main.py` already exists with different content by the time
this merges, **do not overwrite it** — apply only the two additions above as
a patch.

## 2. Stream 1 API contract (implemented, live)

### `GET /health`
Scaffold-only — defined in `backend/app/main.py`, not in the molecular
router. Does not travel with the §1 merge; see the note there.
```json
{ "status": "ok" }
```

### `GET /api/molecular/model-info`

Real response from this backend's last training run (`curl -s
http://localhost:8000/api/molecular/model-info`):

```json
{
  "trained": true,
  "modelType": "RandomForestClassifier",
  "nEstimators": 120,
  "fingerprint": { "type": "morgan", "radius": 2, "nBits": 2048 },
  "dataset": {
    "name": "TDC CYP2D6_Veith",
    "license": "CC BY 4.0",
    "source": "skfp.datasets.tdc.adme.load_cyp2d6_veith (TDC via Hugging Face Hub)"
  },
  "metrics": {
    "auprc": 0.7041078415501184,
    "rocAuc": 0.8515490728177296,
    "precision": 0.6645161290322581,
    "recall": 0.6688311688311688,
    "f1": 0.6666666666666666,
    "confusionMatrix": [[901, 104], [102, 206]],
    "positiveClassPrevalence": 0.2345773038842346,
    "nTrain": 10504,
    "nValidation": 1313,
    "nTest": 1313,
    "decisionThreshold": 0.425
  },
  "splitMethod": "Bemis-Murcko scaffold split (80/10/10)",
  "randomSeed": 42
}
```

When the model hasn't been trained yet (no `backend/models/*.joblib`),
`trained` is `false`, `metrics` is `null`, and `splitMethod`/`randomSeed` are
omitted — the frontend shows "Model not trained yet" with the training
command instead of fabricating numbers.

### `POST /api/molecular/analyze`

Request:
```json
{ "smiles": "CC(=O)Oc1ccccc1C(=O)O" }
```
`smiles` must be 1–500 characters (enforced by FastAPI/Pydantic — violations
return `422` automatically, no custom error handling needed on the frontend
beyond catching non-2xx).

Real response for aspirin (`curl -s -X POST
http://localhost:8000/api/molecular/analyze -d '{"smiles":"CC(=O)Oc1ccccc1C(=O)O"}'`,
`queryImageBase64`/`imageBase64` omitted here for length — they're real PNG
base64 strings in the live response, truncated to 2 of 5 neighbours):

```json
{
  "inputSmiles": "CC(=O)Oc1ccccc1C(=O)O",
  "canonicalSmiles": "CC(=O)Oc1ccccc1C(=O)O",
  "valid": true,
  "molecularFormula": "C9H8O4",
  "molecularWeight": 180.16,
  "neighbors": [
    {
      "identifier": "CYP2D6_Veith_train#4107",
      "smiles": "CC(=O)Oc1ccccc1C(=O)Oc1ccccc1C(=O)O",
      "canonicalSmiles": "CC(=O)Oc1ccccc1C(=O)Oc1ccccc1C(=O)O",
      "tanimotoSimilarity": 0.8571428571428571
    },
    {
      "identifier": "CYP2D6_Veith_train#10262",
      "smiles": "O=C(O)c1ccccc1OP(=O)(O)O",
      "canonicalSmiles": "O=C(O)c1ccccc1OP(=O)(O)O",
      "tanimotoSimilarity": 0.53125
    }
  ],
  "maxSimilarity": 0.8571428571428571,
  "inTrainingSet": false,
  "cyp2d6": {
    "modelTrained": true,
    "prediction": {
      "predictedClass": "non_inhibitor",
      "rawScore": 0.016666666666666666,
      "scoreCalibrated": false,
      "applicabilityWarning": null
    }
  },
  "provenance": {
    "dataset": "TDC CYP2D6_Veith",
    "license": "CC BY 4.0",
    "method": "Morgan fingerprints (radius=2, 2048 bits) + Tanimoto similarity against a cached reference index; CYP2D6 inhibition classified by a locally-trained scikit-learn RandomForestClassifier.",
    "fingerprint": { "type": "morgan", "radius": 2, "nBits": 2048 },
    "referenceSetSize": 10504,
    "reportingThreshold": 0.3
  },
  "limitations": [
    "Predicts an experimental in-vitro CYP2D6 inhibition assay label, not clinical toxicity, drug-drug-gene outcomes, or patient-specific adverse reactions.",
    "Molecular similarity does not establish a clinically important interaction.",
    "This result is never fed into the deterministic clinical verdict used in Medication Review."
  ],
  "error": null
}
```

Field notes:
- `neighbors` has **0 to 5** entries — only compounds at or above
  `provenance.reportingThreshold` (currently `0.30`) are included. When none
  clear the threshold, `neighbors` is `[]` but `maxSimilarity` still reports
  the highest score found, so the UI can say e.g. "nothing reached 0.30, the
  closest was 0.12" instead of just going blank.
- `provenance.referenceSetSize` **always equals `model-info`'s
  `metrics.nTrain`** (`10504` as of the last training run) — the reference
  index (`backend/ml/build_reference_index.py`) is built from the
  classifier's own scaffold-split training set, not a separate sample, so
  `inTrainingSet` and the "Similar to training data" chip mean exactly what
  they say. Enforced by a backend test
  (`test_reference_set_size_matches_training_split_size`).
- `inTrainingSet` is `true` when the canonical SMILES exactly matches a
  reference-index (i.e. training-set) compound, or max Tanimoto similarity
  is `>= 0.999` — i.e. the CYP2D6 score reflects memorisation of that exact
  training example, not generalisation.
- `queryImageBase64` / `neighbors[].imageBase64` are PNG, base64-encoded, no
  `data:` prefix (the frontend prepends `data:image/png;base64,`).
- The frontend never hardcodes `referenceSetSize` or any other count — the
  Explorer's method line (`NeighboursCard`) reads it from this response.

Real response for an invalid SMILES (`curl ... -d
'{"smiles":"not-a-smiles((("}'`) — still HTTP `200`, this is a normal
"unsupported input" result, not a server error:

```json
{
  "inputSmiles": "not-a-smiles(((",
  "canonicalSmiles": null,
  "valid": false,
  "queryImageBase64": null,
  "molecularFormula": null,
  "molecularWeight": null,
  "neighbors": [],
  "maxSimilarity": null,
  "inTrainingSet": false,
  "cyp2d6": { "modelTrained": true, "prediction": null },
  "provenance": { "...": "same shape as above" },
  "limitations": ["...": "same three limitations"],
  "error": "Input is not a valid SMILES string that RDKit can parse."
}
```

## 3. Medication Review: current state and backend contract needed

The Medication Review page (`frontend/src/features/review/ReviewPage.tsx`) is
**fully built against mock fixtures** (`frontend/src/features/review/mocks/*.ts`)
because no deterministic rule-engine backend contract exists yet. It never
computes a clinical verdict client-side — `frontend/src/features/review/api.ts`
is the one place that would change.

Expected real contract (not yet implemented server-side). Note this is one
verdict for the **whole** selected medication list, not one per drug:

```
GET  /api/patients                       -> PatientProfile[]
GET  /api/medications?query=<string>     -> Medication[]
POST /api/assessments                    -> AssessmentResult
     body: { patientId: string, medicationIds: string[] }
```

Types (`frontend/src/types/index.ts`) are the authoritative shape:
`PatientProfile`, `Medication`, `AssessmentResult`, `ClinicalVerdict`,
`EvidenceStatus` (`"association_found" | "no_documented_association" |
"insufficient_evidence"`).

`AssessmentResult`:
```ts
interface AssessmentResult {
  patientId: string
  medications: Medication[]   // the full list this one verdict covers
  verdict: ClinicalVerdict
  generatedAt: string         // ISO 8601
  isMock: boolean             // true for every fixture response; your backend returns false
}
```

`ClinicalVerdict`'s required fields are `evidenceStatus`, `summary`,
`references`, `limitations`. The rest are optional and additive — the UI
degrades gracefully if your backend omits them, but populating them lights
up the corresponding card:

```ts
interface ClinicalVerdict {
  evidenceStatus: EvidenceStatus
  summary: string
  recommendation?: string        // rendered as "Guideline text" — only ever
                                  // real guideline-sourced text, never
                                  // frontend-authored advice
  references: EvidenceReference[]
  limitations: string[]
  mechanism?: FlowNode[]         // 4-node flow: gene -> inhibitor -> substrate -> effect
                                  // (or a node with kind "missing"/"unknown"); renders
                                  // as MechanismCard's flow diagram when present
  checks?: CheckItem[]           // per-medication-pair check list; renders instead of
                                  // the flow diagram when `mechanism` is absent
  missingData?: string[]         // renders as a distinct "Missing data" list above
                                  // "Limitations" in the same card
  evidenceBasis?: string         // e.g. "Guideline-supported", "Incomplete input"
  ruleId?: string
  engineVersion?: string
  evidenceSnapshot?: string      // e.g. a date string for when evidence was last reviewed
}

interface FlowNode {
  kind: 'gene' | 'inhibitor' | 'substrate' | 'effect' | 'unknown' | 'missing'
  label: string   // e.g. "Patient genotype", "Inhibitor on list"
  title: string   // e.g. "CYP2D6 *1/*4"
  sub: string     // e.g. "Intermediate metabolizer · activity score 1.0"
}

interface CheckItem {
  label: string    // e.g. "Metoprolol × Warfarin"
  note: string     // e.g. "CYP2D6 normal metabolizer  ·  CYP2C9 normal metabolizer"
  missing: boolean // true if a gene needed for this pair has no result
}
```

### Worked example per evidence status

These mirror exactly what `frontend/src/features/review/mocks/assessments.ts`
returns for the three demo scenarios — use them as a template for your real
responses.

**`association_found`** (paroxetine + tamoxifen, CYP2D6 intermediate metabolizer):
```json
{
  "evidenceStatus": "association_found",
  "summary": "Paroxetine is a strong CYP2D6 inhibitor, and tamoxifen needs CYP2D6 to form its active metabolite, endoxifen. With intermediate metabolizer CYP2D6 status, this combination is documented to lower endoxifen formation.",
  "references": [
    { "source": "CPIC", "citation": "Goetz MP, et al. CPIC Guideline for CYP2D6 and Tamoxifen Therapy.", "url": "https://cpicpgx.org/guidelines/" }
  ],
  "limitations": ["Demonstration fixture — not a live clinical decision."],
  "mechanism": [
    { "kind": "gene", "label": "Patient genotype", "title": "CYP2D6 *1/*4", "sub": "intermediate metabolizer · activity score 1.0" },
    { "kind": "inhibitor", "label": "Inhibitor on list", "title": "Paroxetine", "sub": "Strong CYP2D6 inhibitor." },
    { "kind": "substrate", "label": "Substrate", "title": "Tamoxifen", "sub": "Converted to endoxifen by CYP2D6." },
    { "kind": "effect", "label": "Documented effect", "title": "Lower endoxifen exposure", "sub": "Reduced formation of the active metabolite." }
  ],
  "evidenceBasis": "Guideline-supported",
  "ruleId": "GDD-2D6-TAM-01",
  "engineVersion": "Rules engine v0.3 (demo)",
  "evidenceSnapshot": "2026-10-20"
}
```

**`no_documented_association`** (metoprolol + warfarin, no CYP2D6/CYP2C9-mediated interaction documented):
```json
{
  "evidenceStatus": "no_documented_association",
  "summary": "No curated gene-drug-drug association matches this patient's genotype and medication list in the supported rule set.",
  "references": [{ "source": "Rule set", "citation": "Curated gene-drug-drug entries searched. None matched this combination." }],
  "limitations": ["Demonstration fixture — not a live clinical decision."],
  "checks": [
    { "label": "Metoprolol × Warfarin", "note": "CYP2D6 normal metabolizer  ·  CYP2C9 normal metabolizer", "missing": false }
  ],
  "evidenceBasis": "Rule set searched",
  "ruleId": "—",
  "engineVersion": "Rules engine v0.3 (demo)",
  "evidenceSnapshot": "2026-10-20"
}
```

**`insufficient_evidence`** (clopidogrel + omeprazole, patient has no CYP2C19 result):
```json
{
  "evidenceStatus": "insufficient_evidence",
  "summary": "A drug-drug association between omeprazole and clopidogrel is documented, but this patient has no CYP2C19 result. The engine cannot assess how their genotype changes it.",
  "references": [
    { "source": "CPIC", "citation": "Lee CR, et al. CPIC Guideline for CYP2C19 and Clopidogrel Therapy, 2022 update.", "url": "https://cpicpgx.org/guidelines/" }
  ],
  "limitations": ["Demonstration fixture — not a live clinical decision.", "This is not a finding of no association."],
  "mechanism": [
    { "kind": "missing", "label": "Patient genotype", "title": "CYP2C19: not tested", "sub": "No result on file. The gene-dependent part of the rule cannot be evaluated." },
    { "kind": "inhibitor", "label": "Inhibitor on list", "title": "Omeprazole", "sub": "Inhibits CYP2C19." },
    { "kind": "substrate", "label": "Substrate", "title": "Clopidogrel", "sub": "Prodrug activated by CYP2C19." },
    { "kind": "unknown", "label": "Documented effect", "title": "Cannot be graded", "sub": "The size of the effect depends on the missing result." }
  ],
  "missingData": ["CYP2C19 genotype or phenotype is not available for this patient."],
  "evidenceBasis": "Incomplete input",
  "ruleId": "GDD-2C19-CLO-01",
  "engineVersion": "Rules engine v0.3 (demo)",
  "evidenceSnapshot": "2026-10-20"
}
```

Regardless of what `summary` says, the frontend **always** renders its own
hard-coded safety callout for `no_documented_association` ("This is not a
safety finding...") and `insufficient_evidence` ("An unresolved result is not
reassurance...") — see `frontend/src/features/review/copy.ts`. Your backend
text doesn't need to repeat that framing; the UI guarantees it regardless.

### Single source of truth for this contract

`frontend/src/contracts/review.ts` holds zod schemas for every type above —
that file, not this document, is authoritative if the two ever disagree.
Two things are generated from it, not hand-maintained:

- `docs/contracts/review.schema.json` — standard JSON Schema, regenerated
  with `cd frontend && npm run schema:review` whenever the zod schemas
  change. Note its `additionalProperties: false` is an artifact of zod's
  JSON Schema export, not the runtime behaviour: `parseWithSchema` (the
  actual validator, in `frontend/src/contracts/validate.ts`) strips unknown
  keys rather than rejecting them, so your backend is free to add fields
  before the frontend is updated to use them.
- `docs/contracts/examples/*.json` — one full `AssessmentResult` per
  evidence status (`association_found.json`, `no_documented_association.json`,
  `insufficient_evidence.json`), identical in content to the worked examples
  above but as standalone files you can diff your real responses against.
  `frontend/src/contracts/review.test.ts` validates both these files and
  every mock fixture against the schema on every test run, so the two can't
  silently drift apart.

Every response from `/api/patients`, `/api/medications`, and
`/api/assessments` is validated against these schemas at the API boundary
(`apiRequest` in `frontend/src/api/client.ts`) before any component sees it.
A response that fails validation — a missing required field, a wrong enum
value — never partially renders; the UI shows a dedicated "Unexpected
response from service" pane naming the exact failing field path instead.
Extra fields your backend adds that the frontend doesn't know about yet are
silently allowed, not an error.

### Switching Medication Review off mock mode

Set `VITE_REVIEW_MODE=live` (see `frontend/.env.example`) — that's it.
`frontend/src/lib/config.ts` derives `MEDICATION_REVIEW_MOCK_MODE` from this
one flag, and `frontend/src/features/review/api.ts` already has the live
branch implemented (calling the three endpoints above through the
schema-validated `apiRequest`) alongside the mock branch; no code edit is
needed on the frontend side once your endpoints exist. The topbar's "Demo
fixtures, not a live engine" chip (`frontend/src/components/shell/Topbar.tsx`)
automatically switches to "Deterministic engine v0.3" in live mode.

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
