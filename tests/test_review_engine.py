import json
import re
from pathlib import Path

from app.models.review import AssessRequest
from app.repositories.guideline_rules_repo import parse_pg_array
from app.services.review_engine import ReviewEngine, mentions_enzyme_inhibitor
from tests.review_fakes import SYNTHETIC_ROWS, FakeLiteratureRepo, FakeRulesRepo

ROOT = Path(__file__).resolve().parents[1]


def req(genotypes, meds, pid="p1"):
    return AssessRequest(
        patientId=pid,
        genotypes=[{"gene": g, "phenotype": p} for g, p in genotypes],
        medications=[{"id": m, "name": m.title()} for m in meds],
    )


def run(genotypes, meds, lit=None):
    return ReviewEngine(FakeRulesRepo(), lit).assess(req(genotypes, meds))["verdict"]


ALL_NORMAL = [("CYP2D6", "normal_metabolizer"), ("CYP2C19", "normal_metabolizer"), ("CYP2C9", "normal_metabolizer"), ("CYP3A5", "non_expresser")]


def test_missing_gene_is_insufficient_never_normal():
    v = run([("CYP2D6", "normal_metabolizer")], ["clopidogrel"])
    assert v.evidenceStatus == "insufficient_evidence"
    assert any("CYP2C19" in m for m in v.missingData)
    assert any(c.missing for c in v.checks)


def test_normal_phenotype_no_association_and_limitation():
    v = run(ALL_NORMAL, ["metoprolol", "warfarin"])
    assert v.evidenceStatus == "no_documented_association"
    assert any("No actionable entry for this phenotype" in c.note for c in v.checks)
    assert any("Normal-metabolizer" in lim for lim in v.limitations)
    assert v.references == []


def test_intermediate_with_matching_summary_found():
    v = run([("CYP2D6", "intermediate_metabolizer")], ["tamoxifen"])
    assert v.evidenceStatus == "association_found"
    assert v.associations[0].ruleId == "GG-CYP2D6-TAMOXIFEN"
    ref = v.references[0]
    assert ref.guidelineId == "SYN1" and ref.annotationVersion == "3" and ref.lastUpdated == "2022-02-10"
    assert "&amp;" not in ref.quote and "<" not in ref.quote and "& intermediate" in ref.quote


def test_recommendation_false_rows_ignored():
    v = run([("CYP2D6", "intermediate_metabolizer")], ["tamoxifen"])
    assert all(r.guidelineId != "SYN2" for r in v.references)


def test_malformed_raw_json_row_ignored():
    v = run([("CYP2D6", "poor_metabolizer")], ["codeine"])
    assert v.evidenceStatus == "no_documented_association"


def test_inhibitor_rule_non_poor_phenotype():
    v = run([("CYP2D6", "intermediate_metabolizer")], ["paroxetine", "tamoxifen"])
    ids = [a.ruleId for a in v.associations]
    assert "GDD-CYP2D6-PAROXETINE-TAMOXIFEN" in ids
    kinds = [n.kind for n in v.mechanism]
    assert kinds == ["gene", "inhibitor", "substrate", "effect"]
    gdd = next(a for a in v.associations if a.ruleId.startswith("GDD"))
    assert gdd.guidelineIds == ["SYN11"]  # aromatase-inhibitor row SYN1 must not be cited
    assert "SYNTHETIC: For intermediate" in v.mechanism[3].sub and "aromatase" not in v.mechanism[3].sub
    assert "Demo inhibitor list, not a clinical source" in v.mechanism[1].sub
    assert any("Demo inhibitor list" in lim for lim in v.limitations)


def test_aromatase_inhibitor_text_does_not_qualify():
    assert not mentions_enzyme_inhibitor("Consider an aromatase inhibitor for CYP2D6 poor metabolizers.", "CYP2D6")
    assert mentions_enzyme_inhibitor("Avoid concomitant CYP2D6 inhibitor use.", "CYP2D6")
    assert mentions_enzyme_inhibitor("Avoid concomitant inhibitor use.", "CYP2D6")
    assert mentions_enzyme_inhibitor("Strong CYP2D6 inhibitors raise exposure.", "CYP2D6")
    assert not mentions_enzyme_inhibitor("Inhibitor use. CYP2D6 poor metabolizers.", "CYP2D6")  # different sentences


def test_no_qualifying_row_means_no_inhibitor_association_but_gene_drug_remains():
    rows = [r for r in SYNTHETIC_ROWS if r[0] != "SYN11"]
    v = ReviewEngine(FakeRulesRepo(rows)).assess(req([("CYP2D6", "intermediate_metabolizer")], ["paroxetine", "tamoxifen"]))["verdict"]
    assert [a.ruleId for a in v.associations] == ["GG-CYP2D6-TAMOXIFEN"]
    assert v.mechanism is None
    assert not any("Demo inhibitor" in lim for lim in v.limitations)


def test_inhibitor_rule_not_triggered_for_poor():
    v = run([("CYP2D6", "poor_metabolizer")], ["paroxetine", "tamoxifen"])
    assert not any(a.ruleId.startswith("GDD") for a in v.associations)
    assert v.mechanism is None


def test_inhibitor_with_normal_phenotype_triggers_rule_per_spec():
    v = run(ALL_NORMAL, ["paroxetine", "tamoxifen"])
    assert any(a.ruleId.startswith("GDD") for a in v.associations)


def test_exact_token_matching():
    assert parse_pg_array("{CYP2D6,CYP2C19}") == ["cyp2d6", "cyp2c19"]
    v = run([("CYP2D6", "poor_metabolizer")], ["codeine"])  # dihydrocodeine row must not match
    assert all(r.guidelineId != "SYN8" for r in v.references)
    v = run([("CYP2D6", "poor_metabolizer")], ["dihydrocodeine"])
    assert v.references[0].guidelineId == "SYN8"


def test_phenotype_word_matching():
    # omeprazole summary mentions ultra-rapid and rapid only
    assert run([("CYP2C19", "poor_metabolizer")], ["omeprazole"]).evidenceStatus == "no_documented_association"
    assert run([("CYP2C19", "ultrarapid_metabolizer")], ["omeprazole"]).evidenceStatus == "association_found"
    assert run([("CYP2C19", "rapid_metabolizer")], ["omeprazole"]).evidenceStatus == "association_found"
    # "likely poor" counts as poor
    assert run([("CYP2C9", "likely poor metabolizer")], ["warfarin"]).evidenceStatus == "association_found"
    # metoprolol summary has "ultrarapid": plain "rapid" must not match it
    assert run([("CYP2D6", "rapid_metabolizer")], ["metoprolol"]).evidenceStatus == "no_documented_association"


def test_unsupported_gene_row_ignored():
    v = run([("TPMT", "poor_metabolizer")], ["azathioprine"])
    assert v.evidenceStatus == "no_documented_association"


def test_output_has_no_forbidden_tokens_or_html():
    for g, m in [
        ([("CYP2D6", "intermediate_metabolizer")], ["paroxetine", "tamoxifen"]),
        (ALL_NORMAL, ["metoprolol", "warfarin"]),
        ([], ["clopidogrel", "omeprazole"]),
    ]:
        text = run(g, m).model_dump_json()
        for bad in ("SAFE", "risk_score", "CRITICAL"):
            assert bad not in text
        assert not re.search(r"</?[a-z][^>]*>", text)


def test_deterministic():
    a = run([("CYP2D6", "intermediate_metabolizer")], ["paroxetine", "tamoxifen"]).model_dump_json()
    b = run([("CYP2D6", "intermediate_metabolizer")], ["tamoxifen", "paroxetine"]).model_dump_json()
    c = run([("CYP2D6", "intermediate_metabolizer")], ["paroxetine", "tamoxifen"]).model_dump_json()
    assert a == c
    assert json.loads(a)["references"] == json.loads(b)["references"]


def test_frontend_demo_scenarios():
    a = run(
        [("CYP2D6", "intermediate_metabolizer"), ("CYP2C19", "intermediate_metabolizer"), ("CYP2C9", "normal_metabolizer"), ("CYP3A5", "non_expresser")],
        ["paroxetine", "tamoxifen"],
    )
    b = run(ALL_NORMAL, ["metoprolol", "warfarin"])
    c = run([("CYP2D6", "normal_metabolizer"), ("CYP2C9", "intermediate_metabolizer")], ["clopidogrel", "omeprazole"])
    assert (a.evidenceStatus, b.evidenceStatus, c.evidenceStatus) == ("association_found", "no_documented_association", "insufficient_evidence")
    assert a.evidenceBasis == "Guideline-supported" and c.evidenceBasis == "Incomplete input" and b.evidenceBasis == "Rule set searched"


def test_missing_data_listed_even_when_association_found():
    v = run([("CYP2D6", "intermediate_metabolizer")], ["tamoxifen", "warfarin"])
    assert v.evidenceStatus == "association_found"
    assert any("CYP2C9" in m for m in v.missingData)


def test_references_sorted_stably():
    v = run([("CYP2D6", "poor_metabolizer")], ["paroxetine", "tamoxifen", "metoprolol"])
    keys = [(r.source, r.guidelineId) for r in v.references]
    assert keys == sorted(keys)


def test_raw_json_requested_only_for_matched_ids():
    repo = FakeRulesRepo()
    ReviewEngine(repo).assess(req([("CYP2D6", "poor_metabolizer")], ["tamoxifen"]))
    assert repo.raw_requests == [["SYN1", "SYN11", "SYN2"]]


def test_medication_search():
    eng = ReviewEngine(FakeRulesRepo())
    names = [m["id"] for m in eng.search_medications("o")]
    assert names == sorted(names, key=lambda n: (not n.startswith("o"), n))
    out = eng.search_medications("par")
    assert out == [{"id": "paroxetine", "name": "Paroxetine"}]
    assert "azathioprine" not in [m["id"] for m in eng.search_medications("")]
    assert "quinidine" in [m["id"] for m in eng.search_medications("quin")]
    prefix_first = eng.search_medications("c")
    assert prefix_first[0]["id"].startswith("c")
    assert len(eng.search_medications("")) <= 15


# ---- literature -----------------------------------------------------------

def lit_rows(*rows):
    return {("CYP2D6", "tamoxifen"): list(rows)}


def row(assoc, pmids):
    return {"entity1_name": "CYP2D6", "entity2_name": "tamoxifen", "association": assoc, "pk": None, "pmids": pmids}


def test_literature_dedupe_sort_cap_and_filter():
    lit = FakeLiteratureRepo(lit_rows(
        row("associated", "{100,200,300}"),
        row("associated", "{300,400,500,600,700}"),
        row("not associated", "{999}"),
        row("associated", "{abc,,12x,\"800\"}"),
    ))
    v = run([("CYP2D6", "intermediate_metabolizer")], ["tamoxifen"], lit)
    pm = [x.pmid for x in v.associations[0].literature]
    assert pm == ["800", "700", "600", "500", "400"]
    assert v.associations[0].literature[0].url == "https://pubmed.ncbi.nlm.nih.gov/800/"
    assert "999" not in pm
    assert {x.status for x in v.associations[0].literature} == {"associated"}


def test_literature_includes_ambiguous_with_status_and_prefers_associated():
    lit = FakeLiteratureRepo(lit_rows(
        row("ambiguous", "{10,20,30}"),
        row("associated", "{20}"),
        row("not associated", "{40}"),
    ))
    v = run([("CYP2D6", "intermediate_metabolizer")], ["tamoxifen"], lit)
    got = {x.pmid: x.status for x in v.associations[0].literature}
    assert got == {"30": "ambiguous", "20": "associated", "10": "ambiguous"}


def test_warfarin_limitation_always_present():
    v = run(ALL_NORMAL, ["metoprolol", "warfarin"])
    assert any("VKORC1" in lim and "CYP4F2" in lim for lim in v.limitations)
    assert not any("VKORC1" in lim for lim in run(ALL_NORMAL, ["metoprolol"]).limitations)


def test_literature_never_changes_verdict():
    base = run([("CYP2D6", "intermediate_metabolizer")], ["tamoxifen"])
    for lit in (None, FakeLiteratureRepo(), FakeLiteratureRepo(raises=True), FakeLiteratureRepo(lit_rows(row("associated", "{1}")))):
        v = run([("CYP2D6", "intermediate_metabolizer")], ["tamoxifen"], lit)
        assert v.evidenceStatus == base.evidenceStatus
        assert v.references == base.references
    v = run(ALL_NORMAL, ["tamoxifen"], FakeLiteratureRepo(lit_rows(row("associated", "{1}"))))
    assert v.evidenceStatus == "no_documented_association" and v.associations is None


# ---- read-only guarantees -------------------------------------------------

def test_engine_does_not_import_supabase_or_core():
    src = (ROOT / "app/services/review_engine.py").read_text()
    for bad in ("supabase", "app.core", "postgrest"):
        assert not re.search(rf"^\s*(from|import)\s+{re.escape(bad)}", src, re.M)


def test_repositories_only_select():
    for name in ("guideline_rules_repo.py", "literature_repo.py", "supabase_readonly.py"):
        src = (ROOT / "app/repositories" / name).read_text()
        for bad in (".insert(", ".update(", ".upsert(", ".delete(", ".rpc(", ".ilike(", ".or_("):
            assert bad not in src, (name, bad)
    assert ".select(" in (ROOT / "app/repositories/guideline_rules_repo.py").read_text()
    assert ".select(" in (ROOT / "app/repositories/literature_repo.py").read_text()
    assert "text_html" not in re.sub(r"#.*", "", (ROOT / "app/repositories/guideline_rules_repo.py").read_text().split("RULE_COLUMNS")[1].split("\n")[0])
