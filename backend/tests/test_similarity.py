import numpy as np

from app.services.molecular import similarity
from app.services.molecular.features import smiles_to_fingerprint


def test_tanimoto_identical_fingerprint_is_one():
    fp = smiles_to_fingerprint("CC(=O)Oc1ccccc1C(=O)O")
    sim = similarity.tanimoto_bulk(fp, np.vstack([fp]))
    assert sim[0] == 1.0


def test_tanimoto_bulk_range():
    fp = smiles_to_fingerprint("CCO")
    refs = np.vstack(
        [
            smiles_to_fingerprint("CCO"),
            smiles_to_fingerprint("c1ccccc1"),
            smiles_to_fingerprint("CC(=O)Oc1ccccc1C(=O)O"),
        ]
    )
    sims = similarity.tanimoto_bulk(fp, refs)
    assert sims[0] == 1.0
    assert (sims >= 0).all() and (sims <= 1).all()


def test_reference_index_available_and_returns_top_k():
    assert similarity.index_available(), "Run ml/build_reference_index.py before testing."
    fp = smiles_to_fingerprint("CC(=O)Oc1ccccc1C(=O)O")
    neighbors = similarity.find_top_k_neighbors(fp, k=5, render_images=False)
    assert len(neighbors) == 5
    sims = [n["tanimotoSimilarity"] for n in neighbors]
    assert sims == sorted(sims, reverse=True)
    for n in neighbors:
        assert n["identifier"].startswith("CYP2D6_Veith#")
