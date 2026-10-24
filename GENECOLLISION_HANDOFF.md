# GeneCollision: design handoff specification

Hackathon build. Frontend target: ship before midnight, 24 Oct 2026.
Visual source of truth: `design/prototype.html` (the interactive prototype). Where this document and the prototype disagree, the prototype wins on looks and this document wins on safety rules.

---

## 0. Kickoff prompt for Claude Code (paste this first)

```
You are building the GeneCollision frontend for a 24-hour AI-in-healthcare hackathon.

Read these two files in full before writing any code:
1. GENECOLLISION_HANDOFF.md (this spec)
2. design/prototype.html (a working prototype; copy its CSS tokens and component styling exactly)

Work phase by phase as defined in section 12 of the spec. After each phase, run the phase's checks, report the raw command output, and STOP. Do not start the next phase until I reply "go".

Hard rules, always in force:
- Everything is free and open source and runs locally. No paid APIs, no cloud model endpoints, no CDN assets at runtime (fonts and icons are bundled via npm), no proprietary UI kits.
- The Medication Review verdict comes only from the deterministic backend response. Nothing from the Molecular Explorer may be imported by, passed to, or displayed inside the Medication Review feature, except one navigation link.
- "No documented association found" must never read as "safe". The safety callouts in section 7 are rendered from constants in the frontend, not from backend text.
- All patients and outputs are synthetic demonstration data and must be labelled as such.
- If the real backend is not available, use the typed mock client in src/api/mock.ts behind VITE_USE_MOCKS=true.

Start with Phase 0 now. Show me the output of `npm run build` and `npm run lint` when done, then STOP.
```

---

## 1. Product in one paragraph

GeneCollision adds a patient's pharmacogenetic profile to a drug–drug interaction check. A doctor picks a synthetic patient, sees their gene phenotypes, selects medications, and runs a **deterministic** assessment that returns exactly one of: association found, no documented association found, ambiguous or insufficient evidence. A separate **Molecular Explorer** takes a SMILES string and returns (A) structurally similar reference compounds and (B) an experimental CYP2D6 inhibition prediction from a locally trained Random Forest. The two never mix.

## 2. Non-negotiable rules

1. **Verdict source.** Only `POST /api/assess` can produce a verdict. No ML score, similarity score or heuristic may alter, colour, rank or annotate it.
2. **No false reassurance.** The `no_documented_association` and `ambiguous_insufficient` states always render their callout (section 7). Never use green, a tick icon, or the words "safe", "no risk", "clear" or "OK" for them.
3. **Visual separation.** Clinical = solid borders, teal and navy, shield icon. Experimental = dashed indigo borders, hatched top band, flask icon, "Experimental" chip. Never swap these.
4. **Isolation by code structure.** `src/features/review/**` must not import from `src/features/molecular/**` and the reverse. Enforce with an ESLint `no-restricted-imports` rule. The only bridge is a navigation link component.
5. **Synthetic labelling.** Persistent "Synthetic data" chip in the top bar and a footer disclaimer on both screens.
6. **Real metrics only.** Model evaluation numbers are read from `metrics.json` produced at training time. The prototype's numbers are placeholders. Never hard-code them. If the file is missing, show "Metrics unavailable" and keep the screen working.
7. **Local only.** No runtime calls to any host other than the local backend.

## 3. Stack

| Concern | Choice |
|---|---|
| App | React 18, Vite, TypeScript (strict) |
| Styling | Plain CSS with custom properties (copy from the prototype). No Tailwind, no UI kit |
| Icons | `lucide-react` (open source, ISC). Prototype icons are Lucide-style, names map 1:1 |
| Fonts | `@fontsource/manrope`, `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono` (bundled, so it works offline) |
| Routing | `react-router-dom`, two routes: `/review`, `/explorer`. Default redirect to `/review` |
| Data | `fetch` wrapped in `src/api/client.ts`, typed responses, `AbortController` on every call |
| State | Component state and one reducer per feature. No global store |
| Tests | Vitest and React Testing Library for the safety invariants in section 11 |

The prototype loads fonts from Google Fonts only so it previews in a browser. Do not copy that `<link>` into the app.

Backend (separate stream, FastAPI): RDKit for parsing, depiction, Morgan fingerprints and Tanimoto. scikit-learn `RandomForestClassifier` trained on TDC `CYP2D6_Veith` (PyTDC, one-time dataset download, then cached in `data/`). Use `get_split(method='scaffold')`. Persist `models/cyp2d6_rf.joblib`, `models/metrics.json`, `models/model_card.json`. Applicability score = highest Tanimoto between the query and any training compound.

## 4. Design tokens

Copy the `:root` block from the prototype. Reference values:

```css
/* colour */
--navy-900:#0B1F3A; --navy-800:#12294A; --navy-700:#1D3B66;
--ink:#0B1F3A; --ink-2:#34485F; --ink-3:#5C6E85;
--bg:#F2F5F9; --surface:#FFFFFF; --surface-2:#F7F9FC; --line:#DCE4EE; --line-2:#E9EEF4;
--teal-700:#0B6F72; --teal-600:#0E8588; --teal-500:#13A1A3; --teal-100:#CFEDEC; --teal-50:#EAF6F6;
--amber-800:#7A4306; --amber-600:#B45F06; --amber-200:#EFD39A; --amber-50:#FFF7E6;
--exp-800:#3F3590; --exp-600:#5B4DBB; --exp-300:#B7AEE6; --exp-200:#D5CFF1; --exp-50:#F4F2FD;
--crit-700:#A61E14; --crit-200:#F5C2BD; --crit-50:#FEF2F1;
/* radius */ --r-sm:8px; --r-md:12px; --r-lg:16px; (pills 999px)
/* shadow */ --sh-1:0 1px 2px rgba(11,31,58,.05); --sh-2:0 1px 2px rgba(11,31,58,.04),0 10px 28px rgba(11,31,58,.06);
/* type */ --f-display:'Manrope'; --f-body:'IBM Plex Sans'; --f-mono:'IBM Plex Mono';
```

Colour roles, kept strictly:

| Role | Colour | Used for |
|---|---|---|
| Clinical, active | teal | selected patient, valid state, normal-metabolizer chips |
| Brand, structure | navy | sidebar, primary button, headings, step numbers |
| Attention | amber | "Association found", reduced-function phenotypes, stale banner |
| Neutral outcome | slate | "No documented association", "Ambiguous" (never green) |
| Experimental | indigo, dashed | everything from the Molecular Explorer |
| Error | red | engine or parse failure only |

Type scale: 11 (eyebrow, uppercase, +0.07em), 12.5 (fine print), 13.5–14 (body), 15 (card title, Manrope 700), 22 (prediction headline), 26 (page title, Manrope 800), 30 (verdict title, Manrope 800). Mono (Plex Mono) for diplotypes, SMILES, scores, rule IDs. Use `tabular-nums` where digits align.

Spacing: 4px base. Common steps 4, 8, 12, 16, 20, 24. Card padding 16. Gap between cards 16 (column) and 20 (grid). Content max width 1380, side padding 24.

Light theme only. `color-scheme: light`.

## 5. Component hierarchy

```
App
├─ Sidebar                      nav: Medication review, Molecular explorer (Experimental tag), PK simulation (disabled, Soon)
│   └─ EvidenceKey              solid teal = clinical, dashed indigo = experimental
├─ Topbar                       breadcrumb, "Deterministic engine v0.3" chip, "Synthetic data" chip, avatar
└─ Routes
   ├─ ReviewPage                src/features/review
   │  ├─ ScenarioStrip          3 demo scenarios + "Simulate engine error" (hide behind ?demo=1 after the hackathon)
   │  ├─ InputColumn
   │  │  ├─ PatientCard        step 1, radio group of synthetic patients
   │  │  ├─ GeneticsCard       step 2
   │  │  │  ├─ Cyp2d6Hero      gene, diplotype, phenotype chip, ActivityScoreMeter
   │  │  │  ├─ GeneRow[]       CYP2C19, CYP2C9, CYP3A5 ("Not tested" dashed chip when missing)
   │  │  │  └─ PhenoconversionNote   shown only when the assessment returns a flag
   │  │  ├─ MedicationsCard    step 3
   │  │  │  ├─ MedicationCombobox   searchable, keyboard accessible
   │  │  │  └─ MedicationRow[]
   │  │  └─ RunBar             sticky, disabled under 2 meds
   │  └─ ResultColumn
   │     ├─ IdlePane           three outcome explainer cards
   │     ├─ LoadingPane        3-step checklist and skeletons
   │     ├─ ErrorPane          "Rules engine unreachable", retry
   │     ├─ ResultsPane
   │     │  ├─ StaleBanner
   │     │  ├─ VerdictCard     one of three variants
   │     │  ├─ MechanismCard   flow of FlowNode, or CheckList when no mechanism applies
   │     │  ├─ EvidenceCard    EvidenceItem[]
   │     │  └─ LimitsCard      missing data and limitations
   │     ├─ ExplorerLink       dashed indigo, navigation only
   │     └─ PKSlot             dashed slate placeholder for the teammate's module
   └─ ExplorerPage              src/features/molecular
      ├─ ExperimentalBanner
      ├─ InputColumn
      │  ├─ SmilesInputCard    textarea, presets, Validate and search, Clear
      │  └─ QueryStructureCard StructureView (RDKit SVG), properties
      └─ ResultColumn
         ├─ NeighboursCard     "A", method line, NeighbourRow[], similarity disclaimer
         ├─ MlPredictionCard   "B", experimental styling
         │  ├─ PredictionTile  class, score, ScoreMeter with threshold tick, applicability chip
         │  ├─ ModelEvaluationPanel   metrics grid, key facts
         │  └─ IsolationNotice
         └─ LimitationsCard

shared/ui: Card, CardHeader, Chip (variants teal, amber, navy, exp, miss, crit), Button (primary, exp, ghost), Banner, Icon, Skeleton, StepBadge, Eyebrow
```

## 6. Screen behaviour

### 6.1 Medication Review

Desktop layout: two columns, left 340–400px inputs, right fluid results. Order on the right: result pane, explorer link, PK slot.

- Selecting a patient loads that patient's medications and resets to the idle state.
- Adding or removing a medication after a result exists does not clear it. It dims the result and shows the stale banner with a "Run again" button.
- Run is disabled with fewer than two medications and while loading. Helper text under the button says why.
- The CYP2D6 activity-score bar spans 0–3 with bands IM 0–1.25, NM 1.25–2.25, UM above 2.25 and a navy marker at the score.
- Phenotype chips: NM teal, IM or PM amber, RM or UM navy, other neutral, missing dashed "Not tested".
- Verdict variants:
  - `association_found`: amber surface, triangle-alert icon.
  - `no_documented_association`: slate surface, search icon, always shows the "not a safety finding" callout.
  - `ambiguous_insufficient`: white surface, dashed slate border, circle-help icon, always shows the "unresolved is not reassurance" callout.
- Mechanism: four-node flow (genotype → inhibitor → substrate → documented effect). A missing genotype renders as a hatched dashed node. When the backend returns `checks` instead of `mechanism`, render the check list with "No curated entry" chips and a neutral minus icon (never a tick).

### 6.2 Molecular Explorer

- Persistent `ExperimentalBanner` at the top. Chips: Runs locally, RDKit, scikit-learn, No external APIs.
- `Validate and search` calls one endpoint and fills both A and B. Invalid SMILES shows an inline field error plus an error pane with the parser message. Nothing partial is shown.
- A: up to five neighbours with 2D thumbnail, name, role, truncated SMILES, Tanimoto to two decimals and a bar. Empty state when nothing reaches the 0.30 threshold, showing the highest score found.
- B: class headline, score, meter with a tick at the model threshold, applicability chip (within / low confidence / outside), nearest training similarity, model evaluation panel, isolation notice.
- Applicability bands (frontend maps backend value): at least 0.50 within, 0.30–0.49 low confidence, under 0.30 outside. Outside and low confidence use the amber chip.
- Structures: render the backend SVG via `<img src="data:image/svg+xml;utf8,${encodeURIComponent(svg)}">`. Do not inject SVG as HTML.

### 6.3 PK slot

A dashed card with a ghost axis and the text "Concentration–time curve renders here". Export `PKSlot` accepting `{ patientId, medicationIds }` so the teammate can replace its body. It must not receive or show the verdict.

## 7. Copy deck (safety-critical strings, hard-code these)

| Key | Text |
|---|---|
| verdict.found.title | Association found |
| verdict.none.title | No documented association found |
| verdict.ambiguous.title | Ambiguous or insufficient evidence |
| verdict.none.callout | **This is not a safety finding.** The rule set covers a limited number of curated associations. No entry means the engine has nothing to report, not that this combination has been shown to be safe. |
| verdict.ambiguous.callout | **An unresolved result is not reassurance.** The engine could not reach a documented answer for this patient and medication list. |
| idle.footer | Verdicts come from a deterministic rules engine. Machine-learning output is never used. |
| error.engine.title | Rules engine unreachable |
| error.engine.body | The assessment service did not respond, so no verdict was produced. This is not a "no association" result. Check that the backend is running, then try again. |
| explorer.banner | Outputs here are computational. They are not clinical evidence, are not validated for patient care, and never change a Medication Review verdict. |
| explorer.similarity | **Similarity is not interaction risk.** Structurally similar molecules can behave differently in the body, and dissimilar ones can interact. A high score does not establish a clinical interaction. |
| explorer.isolation | **Isolated from the clinical assessment.** This prediction is never an input to the deterministic rules engine and cannot change a Medication Review verdict. |
| ml.disclaimer | The score is a model probability, not a calibrated clinical risk. It describes activity in a laboratory assay, not what happens in a patient. |
| footer.synthetic | All patients, genotypes and outputs are synthetic demonstration data. GeneCollision is a hackathon prototype, not a medical device, and must not inform clinical decisions. |

## 8. API contract

Base URL from `VITE_API_BASE` (default `http://localhost:8000`). All JSON. Dev server proxies `/api`.

```ts
// ---- review ----
type Phenotype = { gene: string; diplotype?: string; phenotype?: string; code?: 'PM'|'IM'|'NM'|'RM'|'UM'|'NE'; activity_score?: number; missing?: boolean };
type Patient = { id: string; name: string; age: number; sex: 'F'|'M'; context: string; default_medication_ids: string[]; genes: Phenotype[] };
type Medication = { id: string; name: string; drug_class: string; tag: string };

type Verdict = 'association_found' | 'no_documented_association' | 'ambiguous_insufficient';
type FlowNode = { kind: 'gene'|'inhibitor'|'substrate'|'effect'|'unknown'|'missing'; label: string; title: string; sub: string };
type EvidenceRef = { source: string; title: string; citation: string; kind: string; url?: string };
type Assessment = {
  verdict: Verdict;
  summary: string;
  evidence_basis: string; evidence_basis_detail: string;
  rule_id: string | null; engine_version: string; evidence_snapshot: string;
  medication_ids: string[];
  mechanism?: FlowNode[];
  checks?: { label: string; note: string; gene_result_missing: boolean }[];
  evidence: EvidenceRef[];
  missing_data: string[];
  limitations: string[];
  flag?: { gene: string; text: string };   // e.g. phenoconversion note
};
// GET  /api/patients                 -> Patient[]
// GET  /api/medications?q=           -> Medication[]
// POST /api/assess {patient_id, medication_ids} -> Assessment

// ---- molecular ----
type MoleculeAnalysis = {
  valid: true; canonical_smiles: string; name?: string; formula: string; mol_weight: number; svg: string;
  neighbours: { id: string; name: string; role?: string; smiles: string; svg: string; tanimoto: number }[];
  neighbour_method: { fingerprint: string; radius: number; n_bits: number; metric: 'tanimoto'; threshold: number; reference_set: string; reference_size: number };
  prediction: { assay_class: 'inhibitor'|'non_inhibitor'; score: number; threshold: number; nearest_training_tanimoto: number };
};
type ModelInfo = { algorithm: string; features: string; training_data: string; split: string; trained_at: string; n_train: number; n_test: number; metrics: { auroc: number; auprc: number; accuracy: number; mcc: number } | null };
// POST /api/molecules/analyse {smiles} -> 200 MoleculeAnalysis | 422 { error: { code: 'INVALID_SMILES'; message: string; position?: number } }
// GET  /api/molecules/model-info     -> ModelInfo
```

Errors: network failure or 5xx on `/api/assess` renders `ErrorPane`, never a verdict. Timeout 10s.

## 9. States to implement (both screens)

Idle, loading, error, result, and stale (review only). Loading uses a three-step checklist (review) or skeletons (explorer). All states exist in the prototype. Use the same copy.

## 10. Responsive and accessibility

| Width | Behaviour |
|---|---|
| 1100px and up | Full sidebar (248px), two-column pages |
| 901–1100px | Sidebar becomes a 72px icon rail, mechanism flow turns vertical, ML card stacks |
| 721–900px | Single column pages, outcome cards stack |
| 720px and under | Sidebar becomes a horizontal top strip, 16px side gutters, neighbour rows reflow |

Accessibility: patient list is a `radiogroup`; medication search is a `combobox` with `listbox` (arrow keys, Enter, Escape); results regions are labelled by their headings; the loading pane sets `aria-busy`; errors use `role="alert"`; colour is never the only signal (icons and text accompany every state); visible focus ring 2px teal; respect `prefers-reduced-motion`; minimum text contrast 4.5:1 (use `--amber-800` for amber text, not `--amber-600`).

## 11. Safety invariants to test (Vitest)

1. Rendering `VerdictCard` with `no_documented_association` always includes the `verdict.none.callout` text and never contains "safe" outside that callout.
2. Rendering with `ambiguous_insufficient` includes `verdict.ambiguous.callout`.
3. `ErrorPane` never renders a verdict title.
4. The `features/review` bundle has no import path to `features/molecular` (ESLint rule plus a test that greps imports).
5. `MlPredictionCard` renders `explorer.isolation` and the "Experimental" chip for every response.
6. With `metrics: null`, the evaluation panel shows "Metrics unavailable" and nothing else breaks.
7. A mock assessment of `no_documented_association` has no green colour class applied (snapshot the class list).

## 12. Build phases (phase-gated)

Each phase ends with a STOP. Report raw terminal output for the listed checks.

**Phase 0: scaffold.** Vite + React + TS, ESLint with the isolation rule, Vitest, fontsource packages, `src/styles/tokens.css` copied from the prototype, `VITE_USE_MOCKS`, API types from section 8.
Checks: `npm run build`, `npm run lint`, `npm test`. STOP if any fail or if the built bundle references an external host.

**Phase 1: shell and primitives.** Sidebar, Topbar, routing, shared UI primitives, a `/styleguide` route showing every primitive and chip variant.
Checks: screenshots at 1440, 1024 and 390 widths next to the prototype. STOP until they match.

**Phase 2: Medication Review on mocks.** All components in section 5 under `ReviewPage`, `src/api/mock.ts` ported from the prototype's `evaluate`, all five states, scenario strip.
Checks: the three scenarios return the three verdicts; stale banner works; invariants 1–3 and 7 pass. STOP.

**Phase 3: Molecular Explorer on mocks.** All explorer components, mock analysis for the preset compounds, invalid SMILES, empty-neighbours, outside-domain states.
Checks: invariants 4–6 pass; keyboard-only run-through works. STOP.

**Phase 4: real backend.** Typed client against the FastAPI service, Vite proxy, `ModelInfo` from `metrics.json`, RDKit SVG via data URI, timeouts and abort.
Checks: with the backend running, one real SMILES returns neighbours and a prediction; with it stopped, both screens show the engine error state, never a verdict. STOP.

**Phase 5: demo polish.** Remove placeholder labels once real metrics are wired, README with run steps, 90-second demo script.
Checks: clean clone → `npm i && npm run dev` works offline after install. STOP.

### Prompts for later phases

Phase 1:
```
Phase 0 is approved. Do Phase 1 from GENECOLLISION_HANDOFF.md: shell, routing, shared UI primitives and a /styleguide route. Match design/prototype.html exactly (tokens, radii, chip variants, sidebar evidence key). Show screenshots at 1440, 1024 and 390 widths, then STOP.
```
Phase 2:
```
Phase 1 is approved. Do Phase 2: the Medication Review page using the typed mock client. Include idle, loading, error, result and stale states, the three demo scenarios, and the safety callouts rendered from constants (section 7). Add the Vitest invariants 1, 2, 3 and 7. Show test output, then STOP.
```
Phase 3:
```
Phase 2 is approved. Do Phase 3: the Molecular Explorer with mocks. Dashed indigo experimental styling, A and B sections, model evaluation panel reading ModelInfo (show "Metrics unavailable" when null), invalid SMILES, empty-neighbour and outside-domain states. Do not import anything from features/review. Add invariants 4, 5 and 6. Show test output, then STOP.
```
Phase 4:
```
Phase 3 is approved. Do Phase 4: replace mocks with the real client against the FastAPI backend at VITE_API_BASE. Render RDKit SVG via an img data URI. Any failure on /api/assess must show ErrorPane and never a verdict. Show a real request and response for one SMILES, then stop the backend and show the error state, then STOP.
```
Phase 5:
```
Phase 4 is approved. Do Phase 5: remove placeholder metric labels once metrics.json is wired, write the README and a 90-second demo script, verify offline run after install, then STOP and give me a final checklist of anything not done.
```

## 13. Demo script (90 seconds)

1. Open Medication Review, Patient A is loaded. Point at the CYP2D6 activity bar: intermediate metabolizer.
2. "Association found" appears for paroxetine plus tamoxifen. Walk the mechanism flow, then the evidence references.
3. Click "No documented association". Read the callout aloud: this is not a safety finding.
4. Click "Insufficient evidence". Show the missing CYP2C19 node: the engine says what it cannot know.
5. Open the Molecular Explorer. Point at the dashed indigo styling and the banner: experimental, separate.
6. Run fluoxetine. Show neighbours (A), then the ML prediction and model evaluation (B). Stress the isolation notice.
7. Run metformin. Show "no close neighbours" and "outside applicability domain": the system admits what it does not know.

## 14. Items to verify before the demo

- Every `EvidenceRef` title, citation and URL against its source. The prototype's references are illustrative.
- Synthetic patients' diplotype to phenotype mapping against the CPIC tables you implement in the backend.
- Reference compound set licence (ChEMBL is CC BY-SA 3.0; avoid sources with restrictive academic terms).
- Real metrics replace the prototype's placeholders. Report the split type next to them.
