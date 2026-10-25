# Integration Guide

This document is for whoever owns the shared FastAPI backend and Supabase
database, and for connecting the frontend to the real Medication Review
backend contract once it exists.

## 1. Stream 1 inside the shared app layout

Stream 1 now lives inside the shared FastAPI app (repo-root `app/`), with
one `requirements.txt` at the repo root. There is no separate `backend/`.

| Piece | Path |
|---|---|
| Router (`/api/molecular/...`) | `app/api/v1/endpoints/molecular.py` |
| Services (features, classifier, similarity) | `app/services/molecular/` |
| Pydantic schemas | `app/models/molecular.py` |
| Training / index scripts | `ml/` |
| Model artifacts (gitignored) | `models/molecular/` |
| Tests | `tests/` |

`app/main.py` includes the router directly with
`app.include_router(molecular_router)`. The router declares its own
`/api/molecular` prefix, so it is **not** mounted under `api_router`
(which would put it at `/api/v1/api/molecular/...` and break the frontend).
Public URLs are `POST /api/molecular/analyze` and
`GET /api/molecular/model-info`.

The molecular router:
- Does not import or touch Supabase, `app.core`, or any other router.
- Reads its artifacts from `models/molecular/`, produced from the repo root
  with the venv active: `python ml/train_cyp2d6_model.py` then
  `python ml/build_reference_index.py` (or run `scripts/setup.sh`). If the
  artifacts are missing it degrades gracefully: `model-info` returns
  `trained: false`, and `analyze` still validates/canonicalises/draws
  structures without a prediction or neighbours.
- Uses the packages pinned in the root `requirements.txt`.
- Needs CORS to allow local frontend origins; `app/main.py` allows any
  `http://localhost:<port>` / `http://127.0.0.1:<port>` via
  `allow_origin_regex`.

`tests/test_api.py` builds its own tiny FastAPI app containing only the
molecular router, so the tests never import `app.main`, settings or the
database. `GET /health` belongs to `app/main.py` and is not tested there.

## 2. Stream 1 API contract (implemented, live)

### `GET /health`
Defined in `app/main.py`, not in the molecular router.
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

When the model hasn't been trained yet (no `models/molecular/*.joblib`),
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
  index (`ml/build_reference_index.py`) is built from the
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

### Live mode: the guideline-backed review engine

The backend now serves the Medication Review contract itself:
`GET /api/v1/review/medications?query=` and `POST /api/v1/review/assess`
(see `app/api/v1/endpoints/review.py`, `app/services/review_engine.py`;
read-only against Supabase, SELECT only).

Run everything in live mode with `./scripts/dev.sh`, or by hand:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000         # repo root
cd frontend && VITE_REVIEW_MODE=live npm run dev
```

Required environment names (values never committed):
- repo-root `.env`: `SUPABASE_URL`, `SUPABASE_KEY`
- `frontend/.env.local` (optional): `VITE_REVIEW_MODE` (`mock` default, `live`),
  `VITE_API_BASE_URL` (default `http://127.0.0.1:8000`)

In live mode the topbar chip reads "Guideline engine v1.0 · demo inhibitor
list". Patients stay synthetic frontend data; only genes with a result are
sent (a missing gene is omitted, never defaulted). There is no silent
fallback to mocks: if the service is down the UI says "Review service is not
running" with a retry button, and a response that fails the zod contract
shows the "Unexpected response from service" pane.

Live demo scenarios (expected verdicts):
1. Patient A + paroxetine + tamoxifen (CYP2D6 *1/*4 intermediate) → Association found
2. Patient B + metoprolol + warfarin (CYP2D6, CYP2C9 normal) → No documented association
   (limitations include that warfarin dosing also involves VKORC1/CYP4F2)
3. Patient C + clopidogrel + omeprazole (no CYP2C19 result) → Insufficient evidence

Literature links ("Background reading (PubMed)") use `entity_relationships`
rows with association `associated` or `ambiguous`, each labelled with its
status; they never affect the verdict.

Mock mode is unchanged and remains the default.

**Important constraint carried over from Stream 1 design:** the CYP2D6 ML
classifier's output must never be fed into this deterministic verdict. If
your rule engine wants molecular-similarity context, call
`POST /api/molecular/analyze` separately and surface it as distinct,
clearly-labelled experimental information — not as an input to the verdict
logic.

## 4. Supabase

Nothing in this branch touches Supabase — no schema changes, no credentials,
no client code. Stream 1's model/index artifacts are flat files under
`models/molecular/` (gitignored, regenerated locally via the two training
scripts in `ml/`). Keep all privileged Supabase access server-side
in your routes; Stream 1 does not need Supabase access at all.

## 5. Reproducing the dataset and model locally

```bash
source .venv/bin/activate
python ml/train_cyp2d6_model.py        # downloads TDC CYP2D6_Veith, trains, evaluates
python ml/build_reference_index.py     # builds the Tanimoto reference index
```

Both scripts are idempotent and deterministic (fixed seed = 42). Artifacts
land in `models/molecular/` and are gitignored — regenerate them rather than
committing the ~44MB of binaries.
