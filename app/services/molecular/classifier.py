"""
CYP2D6 inhibition classifier inference service.

Loads the locally-trained Random Forest model and metadata saved by
ml/train_cyp2d6_model.py. Only loads artifacts created locally by
this project (no remote model downloads at inference time).
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np

from .features import fingerprint_metadata
from .similarity import _load_index, tanimoto_bulk

MODELS_DIR = Path(__file__).resolve().parents[3] / "models" / "molecular"
MODEL_PATH = MODELS_DIR / "cyp2d6_random_forest.joblib"
METADATA_PATH = MODELS_DIR / "cyp2d6_model_metadata.json"

LOW_SIMILARITY_WARNING_THRESHOLD = 0.2


@lru_cache(maxsize=1)
def _load_model():
    if not MODEL_PATH.exists():
        return None
    return joblib.load(MODEL_PATH)


@lru_cache(maxsize=1)
def _load_metadata() -> dict | None:
    if not METADATA_PATH.exists():
        return None
    return json.loads(METADATA_PATH.read_text())


def model_trained() -> bool:
    return _load_model() is not None and _load_metadata() is not None


def get_model_metadata() -> dict | None:
    return _load_metadata()


def _max_similarity_to_training_set(query_fp: np.ndarray) -> float | None:
    index = _load_index()
    if index is None:
        return None
    sims = tanimoto_bulk(query_fp, index["fingerprints"])
    return float(np.max(sims)) if len(sims) else None


def predict(query_fp: np.ndarray) -> dict | None:
    model = _load_model()
    metadata = _load_metadata()
    if model is None or metadata is None:
        return None

    score = float(model.predict_proba(query_fp.reshape(1, -1))[0, 1])
    threshold = metadata["metrics"].get("decisionThreshold", 0.5)
    predicted_class = "inhibitor" if score >= threshold else "non_inhibitor"

    max_sim = _max_similarity_to_training_set(query_fp)
    applicability_warning = None
    if max_sim is not None and max_sim < LOW_SIMILARITY_WARNING_THRESHOLD:
        applicability_warning = (
            f"Low structural similarity to training compounds (max Tanimoto {max_sim:.2f}). "
            "This is a heuristic applicability-domain warning, not a validated confidence interval — "
            "treat this prediction with extra caution."
        )

    return {
        "predictedClass": predicted_class,
        "rawScore": score,
        "scoreCalibrated": False,
        "applicabilityWarning": applicability_warning,
    }
