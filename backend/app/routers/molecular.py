"""
Stream 1: Molecular Intelligence Engine router.

Independent, self-contained APIRouter — mount it onto the shared FastAPI
app with a single line (see INTEGRATION.md):

    from app.routers.molecular import router as molecular_router
    app.include_router(molecular_router)

Nothing in this module reaches into another team's routes, database
connections, or app state. It reads its own model/index artifacts from
backend/models/ (produced by backend/ml/*.py) and nothing else.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.molecular import (
    Cyp2d6Prediction,
    Cyp2d6Result,
    DatasetInfo,
    FingerprintInfo,
    ModelInfoResponse,
    ModelMetrics,
    MolecularAnalyzeRequest,
    MolecularAnalyzeResponse,
    Provenance,
    SimilarityNeighbor,
)
from app.services.molecular import classifier, similarity
from app.services.molecular.features import (
    fingerprint_metadata,
    mol_to_fingerprint,
    validate_and_canonicalize,
)
from rdkit import Chem

router = APIRouter(prefix="/api/molecular", tags=["molecular"])

DATASET_NAME = "TDC CYP2D6_Veith"
DATASET_LICENSE = "CC BY 4.0"
METHOD_DESCRIPTION = (
    "Morgan fingerprints (radius=2, 2048 bits) + Tanimoto similarity against a cached reference "
    "index; CYP2D6 inhibition classified by a locally-trained scikit-learn RandomForestClassifier."
)

BASE_LIMITATIONS = [
    "Predicts an experimental in-vitro CYP2D6 inhibition assay label, not clinical toxicity, "
    "drug-drug-gene outcomes, or patient-specific adverse reactions.",
    "Molecular similarity does not establish a clinically important interaction.",
    "This result is never fed into the deterministic clinical verdict used in Medication Review.",
]


@router.post("/analyze", response_model=MolecularAnalyzeResponse)
def analyze_molecule(payload: MolecularAnalyzeRequest) -> MolecularAnalyzeResponse:
    raw_smiles = payload.smiles

    canonical = validate_and_canonicalize(raw_smiles)
    if canonical is None:
        return MolecularAnalyzeResponse(
            inputSmiles=raw_smiles,
            canonicalSmiles=None,
            valid=False,
            neighbors=[],
            cyp2d6=Cyp2d6Result(modelTrained=classifier.model_trained(), prediction=None),
            provenance=Provenance(dataset=DATASET_NAME, license=DATASET_LICENSE, method=METHOD_DESCRIPTION),
            limitations=BASE_LIMITATIONS,
            error="Input is not a valid SMILES string that RDKit can parse.",
        )

    mol = Chem.MolFromSmiles(canonical)
    query_fp = mol_to_fingerprint(mol)

    neighbor_dicts = similarity.find_top_k_neighbors(query_fp) if similarity.index_available() else []
    neighbors = [SimilarityNeighbor(**n) for n in neighbor_dicts]

    cyp2d6_prediction_dict = classifier.predict(query_fp) if classifier.model_trained() else None
    cyp2d6 = Cyp2d6Result(
        modelTrained=classifier.model_trained(),
        prediction=Cyp2d6Prediction(**cyp2d6_prediction_dict) if cyp2d6_prediction_dict else None,
    )

    return MolecularAnalyzeResponse(
        inputSmiles=raw_smiles,
        canonicalSmiles=canonical,
        valid=True,
        neighbors=neighbors,
        cyp2d6=cyp2d6,
        provenance=Provenance(dataset=DATASET_NAME, license=DATASET_LICENSE, method=METHOD_DESCRIPTION),
        limitations=BASE_LIMITATIONS,
        error=None,
    )


@router.get("/model-info", response_model=ModelInfoResponse)
def model_info() -> ModelInfoResponse:
    metadata = classifier.get_model_metadata()
    fp_meta = fingerprint_metadata()

    if metadata is None:
        return ModelInfoResponse(
            trained=False,
            modelType="RandomForestClassifier",
            fingerprint=FingerprintInfo(**fp_meta),
            dataset=DatasetInfo(name=DATASET_NAME, license=DATASET_LICENSE, source="skfp (TDC via Hugging Face Hub)"),
            metrics=None,
        )

    m = metadata["metrics"]
    return ModelInfoResponse(
        trained=True,
        modelType=metadata["modelType"],
        nEstimators=metadata.get("nEstimators"),
        fingerprint=FingerprintInfo(**metadata["fingerprint"]),
        dataset=DatasetInfo(**metadata["dataset"]),
        metrics=ModelMetrics(
            auprc=m["auprc"],
            rocAuc=m["rocAuc"],
            precision=m["precision"],
            recall=m["recall"],
            f1=m["f1"],
            confusionMatrix=m["confusionMatrix"],
            positiveClassPrevalence=m["positiveClassPrevalence"],
            nTrain=m["nTrain"],
            nValidation=m["nValidation"],
            nTest=m["nTest"],
            decisionThreshold=m.get("decisionThreshold"),
        ),
        splitMethod=metadata.get("splitMethod"),
        randomSeed=metadata.get("randomSeed"),
    )
