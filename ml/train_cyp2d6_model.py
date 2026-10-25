"""
Train and evaluate the CYP2D6 inhibition Random Forest classifier.

Pipeline:
  1. Load + clean TDC CYP2D6_Veith (see data_prep.py).
  2. Morgan fingerprints (radius=2, 2048 bits) via app.services.molecular.features.
  3. Bemis-Murcko scaffold train/validation/test split (80/10/10), fixed seed.
  4. RandomForestClassifier(n_estimators=120, class_weight="balanced", n_jobs=-1).
  5. Evaluate on the held-out test set only: AUPRC, ROC-AUC, precision/recall/F1,
     confusion matrix. Decision threshold is tuned on the validation set.
  6. Save model + fingerprint metadata + metrics + dataset provenance.

Run from backend/ with the venv active:
    python ml/train_cyp2d6_model.py
"""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
)

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

from app.services.molecular.features import fingerprint_metadata, smiles_to_fingerprint  # noqa: E402
from ml.data_prep import SPLIT_METHOD, load_clean_dataset, scaffold_split  # noqa: E402

RANDOM_SEED = 42
N_ESTIMATORS = 120
MODELS_DIR = BACKEND_ROOT / "models"
MODEL_PATH = MODELS_DIR / "cyp2d6_random_forest.joblib"
METADATA_PATH = MODELS_DIR / "cyp2d6_model_metadata.json"


def build_features(smiles_list: list[str]) -> np.ndarray:
    feats = [smiles_to_fingerprint(s) for s in smiles_list]
    return np.vstack(feats)


def ensure_both_classes(name: str, y: np.ndarray):
    unique = np.unique(y)
    if len(unique) < 2:
        raise RuntimeError(f"{name} split does not contain both classes: {unique}")


def tune_threshold(y_valid: np.ndarray, scores_valid: np.ndarray) -> float:
    """Pick the threshold maximizing F1 on the validation set only."""
    precisions, recalls, thresholds = precision_recall_curve(y_valid, scores_valid)
    f1s = np.divide(
        2 * precisions * recalls,
        precisions + recalls,
        out=np.zeros_like(precisions),
        where=(precisions + recalls) != 0,
    )
    # precision_recall_curve returns thresholds of length len(precisions) - 1
    best_idx = int(np.argmax(f1s[:-1])) if len(thresholds) > 0 else 0
    if len(thresholds) == 0:
        return 0.5
    return float(thresholds[best_idx])


def main():
    print("Loading and cleaning dataset...")
    df, data_report = load_clean_dataset()
    print(json.dumps(data_report, indent=2, default=str))

    smiles = df["canonical_smiles"].tolist()
    labels = df["label"].to_numpy()

    print("Building scaffold-based train/validation/test split...")
    (train_s, train_y), (valid_s, valid_y), (test_s, test_y) = scaffold_split(smiles, labels)

    ensure_both_classes("train", train_y)
    ensure_both_classes("validation", valid_y)
    ensure_both_classes("test", test_y)

    print(f"Split sizes -> train: {len(train_s)}, valid: {len(valid_s)}, test: {len(test_s)}")

    print("Generating Morgan fingerprints...")
    X_train = build_features(train_s)
    X_valid = build_features(valid_s)
    X_test = build_features(test_s)

    print(f"Training RandomForestClassifier (n_estimators={N_ESTIMATORS})...")
    start = time.time()
    clf = RandomForestClassifier(
        n_estimators=N_ESTIMATORS,
        class_weight="balanced",
        n_jobs=-1,
        random_state=RANDOM_SEED,
    )
    clf.fit(X_train, train_y)
    print(f"Training took {time.time() - start:.1f}s")

    valid_scores = clf.predict_proba(X_valid)[:, 1]
    threshold = tune_threshold(valid_y, valid_scores)
    print(f"Tuned decision threshold (validation-only): {threshold:.4f}")

    print("Evaluating on held-out TEST set (never used in training or tuning)...")
    test_scores = clf.predict_proba(X_test)[:, 1]
    test_preds = (test_scores >= threshold).astype(int)

    auprc = float(average_precision_score(test_y, test_scores))
    try:
        roc_auc = float(roc_auc_score(test_y, test_scores))
    except ValueError:
        roc_auc = None
    precision = float(precision_score(test_y, test_preds, zero_division=0))
    recall = float(recall_score(test_y, test_preds, zero_division=0))
    f1 = float(f1_score(test_y, test_preds, zero_division=0))
    cm = confusion_matrix(test_y, test_preds).tolist()
    prevalence = float(np.mean(test_y))

    metrics = {
        "auprc": auprc,
        "rocAuc": roc_auc,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "confusionMatrix": cm,
        "positiveClassPrevalence": prevalence,
        "nTrain": len(train_s),
        "nValidation": len(valid_s),
        "nTest": len(test_s),
        "decisionThreshold": threshold,
    }

    print(json.dumps(metrics, indent=2))
    print(
        f"AUPRC {auprc:.3f} vs. positive-class prevalence {prevalence:.3f} "
        f"-> lift over random baseline: {auprc / prevalence:.2f}x"
    )

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, MODEL_PATH)

    metadata = {
        "modelType": "RandomForestClassifier",
        "nEstimators": N_ESTIMATORS,
        "randomSeed": RANDOM_SEED,
        "fingerprint": fingerprint_metadata(),
        "dataset": {
            "name": data_report["dataset"],
            "license": data_report["license"],
            "source": data_report["source"],
        },
        "dataPreparation": {k: v for k, v in data_report.items() if k not in ("dataset", "license", "source")},
        "splitMethod": SPLIT_METHOD,
        "metrics": metrics,
        "trainedAtUnix": time.time(),
        "limitations": [
            "Predicts an experimental in-vitro CYP2D6 inhibition assay label (TDC CYP2D6_Veith), "
            "not clinical toxicity, drug-drug-gene outcomes, or patient-specific adverse reactions.",
            "Raw probability score is uncalibrated; only the decision threshold was tuned, "
            "on the validation set, never on the held-out test set.",
            "Model was never trained or tuned on the held-out test set.",
        ],
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2))
    print(f"Saved model to {MODEL_PATH}")
    print(f"Saved metadata to {METADATA_PATH}")


if __name__ == "__main__":
    main()
