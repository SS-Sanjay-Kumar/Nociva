"""
Verifies the scaffold split used during training does not leak duplicate
structures across train/validation/test, and that every split contains
both classes (required for AUPRC/ROC-AUC to be computable).
"""

from ml.data_prep import load_clean_dataset
from ml.train_cyp2d6_model import scaffold_split


def test_no_structure_overlap_across_splits():
    df, _ = load_clean_dataset()
    # Use a slice for test speed; full-dataset split is exercised by the
    # real training run (backend/models/cyp2d6_model_metadata.json).
    sample = df.sample(n=2000, random_state=42).reset_index(drop=True)
    smiles = sample["canonical_smiles"].tolist()
    labels = sample["label"].to_numpy()

    (train_s, _), (valid_s, _), (test_s, _) = scaffold_split(smiles, labels)

    train_set, valid_set, test_set = set(train_s), set(valid_s), set(test_s)
    assert train_set.isdisjoint(valid_set)
    assert train_set.isdisjoint(test_set)
    assert valid_set.isdisjoint(test_set)


def test_splits_contain_both_classes():
    df, _ = load_clean_dataset()
    smiles = df["canonical_smiles"].tolist()
    labels = df["label"].to_numpy()

    (_, train_y), (_, valid_y), (_, test_y) = scaffold_split(smiles, labels)

    for name, y in [("train", train_y), ("valid", valid_y), ("test", test_y)]:
        assert len(set(y.tolist())) == 2, f"{name} split is missing a class"
