"""
Stream 1: Molecular Intelligence Engine router.

Independent, self-contained APIRouter — mount it onto the shared FastAPI
app with a single line (see INTEGRATION.md):

    from app.api.v1.endpoints.molecular import router as molecular_router
    app.include_router(molecular_router)

Nothing in this module reaches into another team's routes, database
connections, or app state. It reads its own model/index artifacts from
models/molecular/ (produced by ml/*.py) and nothing else.
"""

from __future__ import annotations

from fastapi import APIRouter
from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors

from app.models.molecular import (
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
from app.services.molecular.similarity import REPORTING_THRESHOLD, render_molecule_png_b64

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


def _provenance() -> Provenance:
    return Provenance(
        dataset=DATASET_NAME,
        license=DATASET_LICENSE,
        method=METHOD_DESCRIPTION,
        fingerprint=FingerprintInfo(**fingerprint_metadata()),
        referenceSetSize=similarity.reference_set_size(),
        reportingThreshold=REPORTING_THRESHOLD,
    )


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
            provenance=_provenance(),
            limitations=BASE_LIMITATIONS,
            error="Input is not a valid SMILES string that RDKit can parse.",
        )

    mol = Chem.MolFromSmiles(canonical)
    query_fp = mol_to_fingerprint(mol)

    all_neighbor_dicts = similarity.find_top_k_neighbors(query_fp) if similarity.index_available() else []
    max_similarity = all_neighbor_dicts[0]["tanimotoSimilarity"] if all_neighbor_dicts else None
    reported_neighbor_dicts = (
        [n for n in all_neighbor_dicts if n["tanimotoSimilarity"] >= REPORTING_THRESHOLD]
        if max_similarity is not None and max_similarity >= REPORTING_THRESHOLD
        else []
    )
    neighbors = [SimilarityNeighbor(**n) for n in reported_neighbor_dicts]
    in_training_set = similarity.is_in_training_set(canonical, max_similarity)

    cyp2d6_prediction_dict = classifier.predict(query_fp) if classifier.model_trained() else None
    cyp2d6 = Cyp2d6Result(
        modelTrained=classifier.model_trained(),
        prediction=Cyp2d6Prediction(**cyp2d6_prediction_dict) if cyp2d6_prediction_dict else None,
    )

    return MolecularAnalyzeResponse(
        inputSmiles=raw_smiles,
        canonicalSmiles=canonical,
        valid=True,
        queryImageBase64=render_molecule_png_b64(canonical),
        molecularFormula=rdMolDescriptors.CalcMolFormula(mol),
        molecularWeight=round(Descriptors.MolWt(mol), 2),
        neighbors=neighbors,
        maxSimilarity=max_similarity,
        inTrainingSet=in_training_set,
        cyp2d6=cyp2d6,
        provenance=_provenance(),
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
