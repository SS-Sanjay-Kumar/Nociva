"""
Tanimoto similarity search against the precomputed reference compound index.
"""

from __future__ import annotations

import base64
from functools import lru_cache
from io import BytesIO
from pathlib import Path

import joblib
import numpy as np
from rdkit import Chem
from rdkit.Chem import Draw

MODELS_DIR = Path(__file__).resolve().parents[3] / "models" / "molecular"
INDEX_PATH = MODELS_DIR / "reference_index.joblib"

TOP_K = 5
REPORTING_THRESHOLD = 0.30
TRAINING_SET_MATCH_THRESHOLD = 0.999


@lru_cache(maxsize=1)
def _load_index():
    if not INDEX_PATH.exists():
        return None
    return joblib.load(INDEX_PATH)


def index_available() -> bool:
    return _load_index() is not None


def reference_set_size() -> int | None:
    index = _load_index()
    return len(index["identifiers"]) if index is not None else None


def is_in_training_set(canonical_smiles: str, max_similarity: float | None) -> bool:
    """True if the query is (near-)identical to a reference-set compound.

    Checked two ways: an exact canonical-SMILES string match, or a max
    Tanimoto similarity at/above TRAINING_SET_MATCH_THRESHOLD (covers the
    rare case of two valid canonical forms for the same structure).
    """
    index = _load_index()
    if index is None:
        return False
    if canonical_smiles in index["smiles"]:
        return True
    return max_similarity is not None and max_similarity >= TRAINING_SET_MATCH_THRESHOLD


def tanimoto_bulk(query_fp: np.ndarray, reference_fps: np.ndarray) -> np.ndarray:
    """Vectorized Tanimoto similarity between one query and many references."""
    query = query_fp.astype(bool)
    refs = reference_fps.astype(bool)
    intersection = np.logical_and(refs, query).sum(axis=1)
    union = np.logical_or(refs, query).sum(axis=1)
    with np.errstate(divide="ignore", invalid="ignore"):
        sim = np.where(union > 0, intersection / union, 0.0)
    return sim


def render_molecule_png_b64(canonical_smiles: str, size: int = 220) -> str | None:
    mol = Chem.MolFromSmiles(canonical_smiles)
    if mol is None:
        return None
    try:
        img = Draw.MolToImage(mol, size=(size, size))
        buf = BytesIO()
        img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("ascii")
    except Exception:
        return None


def find_top_k_neighbors(query_fp: np.ndarray, k: int = TOP_K, render_images: bool = True) -> list[dict]:
    index = _load_index()
    if index is None:
        return []

    sims = tanimoto_bulk(query_fp, index["fingerprints"])
    top_indices = np.argsort(sims)[::-1][:k]

    neighbors = []
    for idx in top_indices:
        smiles = index["smiles"][idx]
        neighbors.append(
            {
                "identifier": index["identifiers"][idx],
                "smiles": smiles,
                "canonicalSmiles": smiles,
                "tanimotoSimilarity": float(sims[idx]),
                "imageBase64": render_molecule_png_b64(smiles) if render_images else None,
            }
        )
    return neighbors
