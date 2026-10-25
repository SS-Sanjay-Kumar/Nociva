# Nociva: 3-minute demo script

Nociva has three parts: the **Medication Review** (a read-only,
guideline-backed engine), the experimental **Molecular Explorer**, and the
experimental **Pharmacokinetic Simulator**. All patients and compounds are
synthetic.

Run `./scripts/dev.sh` (needs `SUPABASE_URL` and `SUPABASE_KEY` in the
repo-root `.env`) and open the URL Vite prints (usually http://localhost:5173).
The topbar chip reads "Guideline engine v1.0 · demo inhibitor list". Without a
`.env` the backend still starts and serves the Molecular Explorer and the PK
Simulator; only the live Medication Review needs it (mock mode:
`cd frontend && npm run dev`, described in the appendix).

| Beat | Time |
|---|---|
| 1. Scenario A, association found | 40 s |
| 2. Scenario B, no documented association | 30 s |
| 3. Scenario C, insufficient evidence | 30 s |
| 4. Molecular Explorer | 35 s |
| 5. PK Simulator | 40 s |
| Total | about 3 minutes |

**1. Scenario A: Association found (≈40 s).** Click "Association found".
Patient A (CYP2D6 *1/*4, intermediate) + paroxetine + tamoxifen.
- Point at the amber verdict, the mechanism flow, and "Matched associations"
  (`GG-CYP2D6-TAMOXIFEN`, `GDD-CYP2D6-PAROXETINE-TAMOXIFEN`).
- Point at an evidence card: source, annotation version and date, and the
  quoted guideline text ("Show full text").
- *Honest limit:* the paroxetine inhibitor link comes from a demo inhibitor
  list, not a clinical source; only the quoted DPWG text is cited for it.

**2. Scenario B: No documented association (≈30 s).** Click "No documented
association". Patient B (CYP2D6 and CYP2C9 normal) + metoprolol + warfarin.
- Read the callout: *"This is not a safety finding."* The engine found
  nothing to report; that is not evidence the combination is safe.
- *Honest limit:* warfarin dosing also involves VKORC1 and CYP4F2, which
  this tool does not evaluate (listed under limitations).

**3. Scenario C: Insufficient evidence (≈30 s).** Click "Insufficient
evidence". Patient C (no CYP2C19 result) + clopidogrel + omeprazole.
- Point at "Missing data": CYP2C19 is untested, so the engine refuses to
  assume normal. *An unresolved result is not reassurance.*
- *Honest limit:* guideline text is quoted, not interpreted; the engine
  gives no dosing or prescribing advice.

**4. Molecular Explorer (≈35 s).** Open "Molecular explorer" (sidebar, EXP
chip). The default structure runs; paste aspirin
(`CC(=O)OC1=CC=CC=C1C(=O)O`) and click "Validate and search".
- Point at the five nearest neighbours with Tanimoto similarity and the
  experimental CYP2D6 prediction, with its dashed "not clinical evidence"
  treatment. It never changes a verdict.
- *Honest limit:* the model predicts an assay on public data, not a patient.

**5. PK Simulator (≈40 s).** Open "PK simulation" (sidebar, SIM chip).
Synthetic Compound X runs automatically.
- Point at the banner: *"Research demonstration with synthetic parameters. Not
  a clinical dosing or toxicity tool."*
- Drag the clearance multiplier to 0.5 and click **Run simulation**: the dashed
  amber curve is labelled hypothetical; read the interpretation sentence
  (greater predicted exposure) and the AUC change card.
- Tick **Monte Carlo** and run again: the shaded bands are labelled "Assumed
  demonstration distribution, not a validated interval."
- *Honest limit:* single oral dose, invented parameters; the collapsed
  contextual inputs are echoed but never used in the calculation, and the page
  is not connected to the Medication Review verdict.

## Three lines to say out loud

- *"No documented association is not a safety finding."*
- *"Experimental, and it never changes the clinical verdict."*
- *"This predicts an assay, not a patient."*

---

## Appendix: mock-mode walkthrough (no backend or `.env`)

With `VITE_REVIEW_MODE` unset the Medication Review runs on typed fixtures and
the topbar chip reads "Demo fixtures, not a live engine". The Molecular
Explorer and PK Simulator still need the backend (`uvicorn app.main:app
--port 8000`, no `.env` required).

### Mock-mode Medication Review — demonstration fixtures, not a live engine

The topbar shows **"Demo fixtures, not a live engine"** — point at it once:
*"Medication Review is wired to typed mock data right now. There's no
deterministic backend yet, so nothing here should be read as a real
clinical system — but the UI, states, and safety copy are exactly what the
real one will slot into."*

1. **Click the "Association found" scenario pill.** Patient A (CYP2D6
   intermediate metabolizer) + paroxetine + tamoxifen loads and runs
   automatically.
   - Point at the amber verdict card and the mechanism flow (genotype →
     inhibitor → substrate → effect).
   - *Say: "Paroxetine blocks CYP2D6, and tamoxifen needs CYP2D6 to become
     its active form. That's a real, citable interaction — CPIC-documented."*

2. **Click "No documented association."** Patient B + metoprolol + warfarin.
   - Point at the slate verdict card and read the callout out loud:
     *"This is not a safety finding. No entry means the engine has nothing
     to report, not that this combination has been shown to be safe."*
   - That sentence is hard-coded in the frontend, not generated by the mock
     data — it always shows for this status no matter what the backend says.

3. **Click "Insufficient evidence."** Patient C + clopidogrel + omeprazole.
   Patient C has no CYP2C19 result.
   - Point at the dashed card and the mechanism's hatched "CYP2C19: not
     tested" node.
   - Read the callout: *"An unresolved result is not reassurance. The engine
     could not reach a documented answer for this patient and medication
     list."*

4. **Click "Simulate engine error."** The result pane is replaced by the red
   error pane — *"Rules engine unreachable"* — never a verdict.
   - *Say: "A failed request never falls back to a default verdict. It fails
     loudly, every time."*

### Molecular Explorer — live against the local API

Point at the dashed indigo experimental banner: *"Everything past this
point is a real computation against a locally-trained model — but it's
experimental, and it never changes the Medication Review verdict."*

1. **Fluoxetine** (loads by default): real RDKit structure, 5 Tanimoto
   neighbours from the classifier's full 10,504-compound training split —
   point at the method line, which reads that count from the live response,
   not a hardcoded number. Predicted **inhibitor** at a raw score of ~0.80.
   - Point at **"Raw model score (uncalibrated)"**: *"This is an assay
     label, not a patient outcome — it's never calibrated against real-world
     risk."*

2. **Aspirin** preset: predicted **non-inhibitor**, low score (~0.02), but a
   close neighbour at ~0.86 Tanimoto (an aspirin diester analogue) — a good
   contrast to make: *"High structural similarity and a low inhibition score
   can sit right next to each other. One doesn't imply the other."*

3. **Metformin** preset: predicted **non-inhibitor** (~0.13), only one
   neighbour clears the 0.30 reporting threshold at ~0.36 — a good moment to
   say: *"Similarity is not interaction risk. A high score doesn't prove a
   clinical interaction, and a low one doesn't rule one out."* (That line is
   in the UI too, under the neighbours list.)

4. **"Invalid example" preset**: shows the inline field error and the
   dedicated "This SMILES could not be parsed" pane — nothing partial
   renders alongside it.

5. **Stop the backend** (`Ctrl+C` in its terminal) and click "Validate and
   search" again: the page shows **"Molecular service unavailable"** with
   the exact command to restart it, instead of hanging or showing stale
   data.

### Three lines to say out loud

- *"No documented association is not a safety finding."*
- *"Experimental, and it never changes the clinical verdict."*
- *"This predicts an assay, not a patient."*
