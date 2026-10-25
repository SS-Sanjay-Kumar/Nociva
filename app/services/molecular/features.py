"""
Shared fingerprint feature extraction.

CRITICAL: training and inference must use identical fingerprint settings.
This module is the single source of truth for both; it is imported by
ml/train_cyp2d6_model.py and by the FastAPI inference service.
"""

from __future__ import annotations

import numpy as np
from rdkit import Chem
from rdkit.Chem import rdFingerprintGenerator

FINGERPRINT_RADIUS = 2
FINGERPRINT_N_BITS = 2048
FINGERPRINT_TYPE = "morgan"


def get_fingerprint_generator():
    return rdFingerprintGenerator.GetMorganGenerator(
        radius=FINGERPRINT_RADIUS, fpSize=FINGERPRINT_N_BITS
    )


def validate_and_canonicalize(smiles: str) -> str | None:
    """Return canonical SMILES, or None if the input is not a valid molecule."""
    if not smiles or not isinstance(smiles, str):
        return None
    smiles = smiles.strip()
    if not smiles or len(smiles) > 500:
        return None
    mol = Chem.MolFromSmiles(smiles)
    if mol is None:
        return None
    try:
        return Chem.MolToSmiles(mol, canonical=True)
    except Exception:
        return None


def mol_to_fingerprint(mol: Chem.Mol) -> np.ndarray:
    """Convert an RDKit Mol to a dense bit-vector Morgan fingerprint."""
    generator = get_fingerprint_generator()
    fp = generator.GetFingerprint(mol)
    arr = np.zeros((FINGERPRINT_N_BITS,), dtype=np.uint8)
    for bit in fp.GetOnBits():
        arr[bit] = 1
    return arr


def smiles_to_fingerprint(canonical_smiles: str) -> np.ndarray | None:
    mol = Chem.MolFromSmiles(canonical_smiles)
    if mol is None:
        return None
    return mol_to_fingerprint(mol)


def fingerprint_metadata() -> dict:
    return {
        "type": FINGERPRINT_TYPE,
        "radius": FINGERPRINT_RADIUS,
        "nBits": FINGERPRINT_N_BITS,
    }
