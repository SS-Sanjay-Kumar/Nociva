from app.services.molecular import classifier
from app.services.molecular.features import smiles_to_fingerprint


def test_model_loads_and_reports_trained():
    assert classifier.model_trained(), "Run ml/train_cyp2d6_model.py before testing."
    metadata = classifier.get_model_metadata()
    assert metadata is not None
    assert metadata["modelType"] == "RandomForestClassifier"
    assert "metrics" in metadata


def test_predict_returns_expected_shape():
    fp = smiles_to_fingerprint("CC(=O)Oc1ccccc1C(=O)O")
    result = classifier.predict(fp)
    assert result is not None
    assert result["predictedClass"] in ("inhibitor", "non_inhibitor")
    assert 0.0 <= result["rawScore"] <= 1.0
    assert result["scoreCalibrated"] is False


def test_predict_is_deterministic():
    fp = smiles_to_fingerprint("CCO")
    r1 = classifier.predict(fp)
    r2 = classifier.predict(fp)
    assert r1["rawScore"] == r2["rawScore"]
    assert r1["predictedClass"] == r2["predictedClass"]
