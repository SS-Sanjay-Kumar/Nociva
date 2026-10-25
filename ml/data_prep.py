"""
Data preparation for the CYP2D6 inhibition classifier.

Loads the TDC CYP2D6_Veith dataset, validates structures with RDKit,
canonicalizes, and removes duplicates / conflicting labels. Prints a
provenance and class-distribution report so numbers in INTEGRATION.md /
model metadata are always measured, never guessed.
"""

from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.services.molecular.features import validate_and_canonicalize  # noqa: E402

DATASET_NAME = "TDC CYP2D6_Veith"
DATASET_LICENSE = "CC BY 4.0"
DATASET_SOURCE = "skfp.datasets.tdc.adme.load_cyp2d6_veith (TDC via Hugging Face Hub)"
SPLIT_METHOD = "Bemis-Murcko scaffold split (80/10/10)"


def load_raw() -> pd.DataFrame:
    from skfp.datasets.tdc.adme import load_cyp2d6_veith

    df = load_cyp2d6_veith(as_frame=True)
    # Observed columns: "SMILES", "Y" (binary: 1 = CYP2D6 inhibitor in the
    # Veith high-throughput screening assay, 0 = non-inhibitor).
    label_col = "Y" if "Y" in df.columns else "label"
    df = df.rename(columns={label_col: "label"})
    return df[["SMILES", "label"]].copy()


def clean(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    report = {"dataset": DATASET_NAME, "license": DATASET_LICENSE, "source": DATASET_SOURCE}
    report["n_raw"] = len(df)
    report["raw_class_distribution"] = df["label"].value_counts().to_dict()

    df = df.copy()
    df["canonical_smiles"] = df["SMILES"].apply(validate_and_canonicalize)

    n_invalid = df["canonical_smiles"].isna().sum()
    report["n_invalid_smiles_removed"] = int(n_invalid)
    df = df.dropna(subset=["canonical_smiles"])

    # Detect conflicting labels for the same canonical structure, drop them.
    label_counts_per_smiles = df.groupby("canonical_smiles")["label"].nunique()
    conflicting = label_counts_per_smiles[label_counts_per_smiles > 1].index
    report["n_conflicting_structures_removed"] = int(len(conflicting))
    df = df[~df["canonical_smiles"].isin(conflicting)]

    n_before_dedup = len(df)
    df = df.drop_duplicates(subset=["canonical_smiles"], keep="first")
    report["n_exact_duplicates_removed"] = int(n_before_dedup - len(df))

    df = df.reset_index(drop=True)
    report["n_clean"] = len(df)
    report["clean_class_distribution"] = df["label"].value_counts().to_dict()
    report["positive_class_prevalence"] = float(df["label"].mean())

    return df, report


def load_clean_dataset() -> tuple[pd.DataFrame, dict]:
    raw = load_raw()
    return clean(raw)


def scaffold_split(smiles: list[str], labels):
    """Bemis-Murcko scaffold train/valid/test split, shared by the classifier
    training script and the reference-index build script so both agree on
    exactly which compounds are "training data". skfp's scaffold splitter
    takes no random_state — it buckets by deterministic scaffold grouping,
    so calling it twice with the same (smiles, labels) in the same order
    always reproduces the identical split.
    """
    from skfp.model_selection import scaffold_train_valid_test_split

    train_s, valid_s, test_s, train_y, valid_y, test_y = scaffold_train_valid_test_split(
        smiles,
        labels,
        train_size=0.8,
        valid_size=0.1,
        test_size=0.1,
    )
    return (train_s, train_y), (valid_s, valid_y), (test_s, test_y)


if __name__ == "__main__":
    import json

    df, report = load_clean_dataset()
    print(json.dumps(report, indent=2, default=str))
