"""
Build the reference compound index used for Tanimoto similarity search,
training-set-membership flagging, and the ML applicability heuristic in the
Molecular Explorer.

The index is built from the classifier's TRAINING SPLIT ONLY, using the
exact same scaffold split (and therefore the exact same compounds) as
backend/ml/train_cyp2d6_model.py. This makes "training data" in the UI mean
what it says: neighbours, inTrainingSet, and the "Similar to training data"
heuristic are all checked against the same compounds the model was fit on
-- never the validation or held-out test split.

Identifiers are dataset row indices since the dataset provides no compound
names -- never invent names for unnamed compounds. Fingerprints are
precomputed and cached so API requests don't recompute thousands of
fingerprints per call.

Run from backend/ with the venv active (after training the model, so the
two scripts' splits are both loggable from the same run):
    python ml/train_cyp2d6_model.py
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
from ml.data_prep import SPLIT_METHOD, load_clean_dataset, scaffold_split  # noqa: E402

MODELS_DIR = BACKEND_ROOT / "models"
INDEX_PATH = MODELS_DIR / "reference_index.joblib"


def main():
    df, _ = load_clean_dataset()
    smiles = df["canonical_smiles"].tolist()
    labels = df["label"].to_numpy()

    (train_s, train_y), _, _ = scaffold_split(smiles, labels)

    identifiers = [f"CYP2D6_Veith_train#{i}" for i in range(len(train_s))]
    fingerprints = np.vstack([smiles_to_fingerprint(s) for s in train_s])

    index = {
        "identifiers": identifiers,
        "smiles": train_s,
        "labels": list(train_y),
        "fingerprints": fingerprints,
        "fingerprintMeta": fingerprint_metadata(),
        "splitSource": "train",
        "splitMethod": SPLIT_METHOD,
        "size": len(train_s),
    }

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(index, INDEX_PATH)
    print(f"Saved reference index with {len(identifiers)} training-split compounds to {INDEX_PATH}")


if __name__ == "__main__":
    main()
