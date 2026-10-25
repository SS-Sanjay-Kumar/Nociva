from app.services.molecular.features import mol_to_fingerprint, smiles_to_fingerprint, validate_and_canonicalize
from rdkit import Chem


def test_valid_smiles_canonicalizes():
    assert validate_and_canonicalize("c1ccccc1") == "c1ccccc1"
    # Non-canonical aspirin input should canonicalize to a consistent form.
    canon_a = validate_and_canonicalize("CC(=O)Oc1ccccc1C(=O)O")
    canon_b = validate_and_canonicalize("O=C(C)Oc1ccccc1C(=O)O")
    assert canon_a == canon_b


def test_invalid_smiles_returns_none():
    assert validate_and_canonicalize("not-a-smiles(((") is None
    assert validate_and_canonicalize("") is None
    assert validate_and_canonicalize("   ") is None


def test_oversized_smiles_rejected():
    assert validate_and_canonicalize("C" * 600) is None


def test_fingerprint_reproducibility():
    smiles = "CC(=O)Oc1ccccc1C(=O)O"
    fp1 = smiles_to_fingerprint(smiles)
    fp2 = smiles_to_fingerprint(smiles)
    assert fp1 is not None
    assert (fp1 == fp2).all()


def test_fingerprint_shape_and_dtype():
    mol = Chem.MolFromSmiles("CCO")
    fp = mol_to_fingerprint(mol)
    assert fp.shape == (2048,)
    assert fp.dtype.kind == "u"
