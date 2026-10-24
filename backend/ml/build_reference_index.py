"""
Build the reference compound index used for Tanimoto similarity search in
the Molecular Explorer.

We reuse the cleaned CYP2D6_Veith training compounds as the reference
library (identifiers are dataset row indices since the dataset provides no
compound names — never invent names for unnamed compounds). Fingerprints
are precomputed and cached so API requests don't recompute 13k fingerprints
per call.

Run from backend/ with the venv active:
    python ml/build_reference_index.py
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.molecular.features import fingerprint_metadata, smiles_to_fingerprint  # noqa: E402
from ml.data_prep import load_clean_dataset  # noqa: E402

MODELS_DIR = BACKEND_ROOT / "models"
INDEX_PATH = MODELS_DIR / "reference_index.joblib"

# Cap the reference library size to keep similarity search fast and the
# artifact small; a random (seeded) subsample is representative enough for
# a demo-scale nearest-neighbour search.
MAX_REFERENCE_COMPOUNDS = 4000
RANDOM_SEED = 42


def main():
    df, _ = load_clean_dataset()

    if len(df) > MAX_REFERENCE_COMPOUNDS:
        df = df.sample(n=MAX_REFERENCE_COMPOUNDS, random_state=RANDOM_SEED).reset_index(drop=True)

    identifiers = [f"CYP2D6_Veith#{i}" for i in df.index]
    smiles = df["canonical_smiles"].tolist()
    labels = df["label"].tolist()

    fingerprints = np.vstack([smiles_to_fingerprint(s) for s in smiles])

    index = {
        "identifiers": identifiers,
        "smiles": smiles,
        "labels": labels,
        "fingerprints": fingerprints,
        "fingerprintMeta": fingerprint_metadata(),
    }

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(index, INDEX_PATH)
    print(f"Saved reference index with {len(identifiers)} compounds to {INDEX_PATH}")


if __name__ == "__main__":
    main()
