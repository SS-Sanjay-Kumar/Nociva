# Model artifacts: timing, sizes, and distribution

## Setup scripts

- `scripts/setup.sh` — creates `backend/.venv`, installs backend and
  frontend deps, trains the model and builds the reference index **only if
  those artifacts are missing** (safe to re-run; every step is idempotent).
- `scripts/dev.sh` — starts backend (`:8000`) and frontend (Vite) together;
  Ctrl+C stops both.

## Timing (this machine, Apple Silicon, cold start)

Measured by clearing `~/scikit_learn_data` (the TDC dataset cache) and
`backend/models/` and timing `scripts/setup.sh` end to end, then timing the
two ML scripts individually with the dataset now cached:

| Step | Wall time |
|---|---|
| `ml/train_cyp2d6_model.py` (dataset download + scaffold split + RF fit + eval) | ~5.6s |
| `ml/build_reference_index.py` | ~5.1s |
| Full `scripts/setup.sh` (pip/npm already satisfied, dataset cached from the step above) | ~12.4s |

The TDC CYP2D6_Veith download itself is small (~764KB cached) and fast on
any reasonable connection — the dominant cost here is Morgan fingerprint
generation over ~13k + ~10.5k compounds, not network or disk I/O.

## Artifact sizes (current shipped model)

| File | Size |
|---|---|
| `cyp2d6_random_forest.joblib` | 36MB |
| `reference_index.joblib` | 22MB |
| `cyp2d6_model_metadata.json` | 4KB |
| **Total** | **~58MB** |

## How artifacts should travel to teammates — recommendation, not implemented

Three options, roughly in order of preference for this project's situation
(small team, hackathon timeline, artifacts regenerate deterministically
from a fixed seed):

1. **Train at setup (current approach, via `scripts/setup.sh`).** Zero
   extra infrastructure, always exactly reproducible, but costs every
   teammate ~10-15s the first time they set up (see timing above — this is
   not a real burden at this size) and requires network access to fetch
   the dataset once. Recommended default: it's already working, it's fast,
   and it sidesteps every artifact-distribution problem below by not
   having one.
2. **Git LFS for `backend/models/*.joblib`.** Keeps the repo self-contained
   (clone and go, no training step), but adds LFS as a hard requirement
   for anyone touching the repo, including CI, and 58MB in LFS is a real
   but modest storage/bandwidth cost. Worth it only once the training step
   becomes slow enough to annoy people (it isn't yet) or the dataset
   becomes harder to fetch reliably.
3. **Shrink the model and/or ship it as a release asset / artifact
   download** (e.g. a GitHub Release binary, or an S3/object-storage URL
   fetched by `setup.sh`). Decouples repo size from model size and avoids
   LFS, but adds a release/publish step to the workflow and a new failure
   mode (asset host unavailable). Only worth it if the model needs to grow
   much larger than today's 36MB, or if train-at-setup becomes impractical
   (e.g. a dataset that requires auth or is no longer reliably mirrored).

Given today's numbers, (1) is fine as-is. Revisit if setup time or dataset
availability becomes a real complaint.

## Smaller RandomForest: does it clear the bar?

Explored whether fewer trees / limited depth loses less than 0.01 AUPRC
and cuts artifact size by more than half, **as an experiment only — the
shipped model and `ml/train_cyp2d6_model.py` are unchanged.** All configs
trained on the identical scaffold split used by the shipped model, so
numbers are directly comparable (held-out test AUPRC):

| Config | AUPRC | Δ AUPRC | Size | Size reduction |
|---|---|---|---|---|
| **Shipped: n_estimators=120, max_depth=None** | 0.7041 | — | 36.16MB | — |
| n_estimators=120, max_depth=25 | 0.7023 | **-0.0018** | 16.50MB | **-54.4%** |
| n_estimators=120, max_depth=20 | 0.6923 | -0.0118 | 11.56MB | -68.0% |
| n_estimators=100, max_depth=None | 0.7018 | -0.0023 | 30.10MB | -16.8% |
| n_estimators=80, max_depth=None | 0.7032 | -0.0009 | 24.07MB | -33.4% |
| n_estimators=50, max_depth=None | 0.6897 | -0.0144 | 15.11MB | -58.2% |
| n_estimators=50, max_depth=12 | 0.6658 | -0.0383 | 1.67MB | -95.4% |

**One config clears both bars: `n_estimators=120, max_depth=25`** — loses
0.0018 AUPRC (well under 0.01) and cuts size 54.4% (over half), landing at
16.50MB instead of 36.16MB. `n_estimators=80, max_depth=None` is close but
only cuts size 33% despite a smaller AUPRC loss (0.0009) — depth, not tree
count, is what's driving this model's size.

**Not applied.** This is reported for your decision, per instruction —
changing `N_ESTIMATORS`/adding `max_depth` in `ml/train_cyp2d6_model.py`
and reshipping the smaller model needs your approval first.
