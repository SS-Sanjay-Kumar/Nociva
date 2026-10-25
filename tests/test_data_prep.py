import pandas as pd

from ml.data_prep import clean


def test_clean_removes_invalid_smiles():
    df = pd.DataFrame({"SMILES": ["CCO", "not-a-smiles(((", "c1ccccc1"], "label": [0, 1, 1]})
    cleaned, report = clean(df)
    assert report["n_invalid_smiles_removed"] == 1
    assert len(cleaned) == 2


def test_clean_removes_exact_duplicates():
    df = pd.DataFrame(
        {"SMILES": ["CCO", "OCC", "c1ccccc1"], "label": [0, 0, 1]}
    )  # CCO and OCC are the same molecule (ethanol)
    cleaned, report = clean(df)
    assert report["n_exact_duplicates_removed"] == 1
    assert len(cleaned) == 2


def test_clean_removes_conflicting_labels():
    df = pd.DataFrame(
        {"SMILES": ["CCO", "OCC", "c1ccccc1"], "label": [0, 1, 1]}
    )  # same molecule, conflicting labels -> both dropped
    cleaned, report = clean(df)
    assert report["n_conflicting_structures_removed"] == 1
    assert len(cleaned) == 1
    assert cleaned.iloc[0]["canonical_smiles"] == "c1ccccc1"
