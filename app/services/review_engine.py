"""Deterministic, read-only, guideline-backed medication review engine.

Pure logic: rows arrive through injected repository objects, so nothing here
touches a database, the network or application settings. The engine quotes
guideline text; it never scores, grades risk, or composes clinical advice.
"""

from __future__ import annotations

import html
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Dict, List, Optional, Protocol, Tuple

from app.models.review import (
    AssessRequest,
    Association,
    CheckItem,
    ClinicalVerdict,
    EvidenceReference,
    FlowNode,
    LiteratureLink,
    MedicationOut,
)

ENGINE_VERSION = "Guideline engine v1.0"
EVIDENCE_SNAPSHOT = "ClinPGx guideline annotations, versions per reference"
SUPPORTED_GENES = ("CYP2D6", "CYP2C19", "CYP2C9", "CYP3A5")
DEMO_LABEL = "Demo inhibitor list, not a clinical source"
INHIBITOR_FILE = Path(__file__).resolve().parents[1] / "data" / "cyp_inhibitors.json"
MAX_LITERATURE = 5
NO_ACTIONABLE = "No actionable entry for this phenotype in the guideline summary"
NORMAL_LIMITATION = "Normal-metabolizer recommendations are not evaluated by this engine."

# phenotype key -> regex over normalised guideline text
PHENOTYPE_PATTERNS = {
    "ultrarapid": re.compile(r"\bultrarapid\b"),
    "rapid": re.compile(r"\brapid\b"),
    "poor": re.compile(r"\bpoor\b"),
    "intermediate": re.compile(r"\bintermediate\b"),
    "non expresser": re.compile(r"\bnon ?expressers?\b"),
}


class RulesSource(Protocol):
    def get_rules(self) -> List[Dict[str, Any]]: ...
    def get_raw_json(self, guideline_ids) -> Dict[str, Optional[str]]: ...


class LiteratureSource(Protocol):
    def get_pair_rows(self, gene: str, chemical: str) -> List[Dict[str, Any]]: ...


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: List[str] = []

    def handle_data(self, data: str) -> None:
        self.parts.append(data)


def plain_text(markup: str) -> str:
    """Strips tags, decodes entities, collapses whitespace. Never returns HTML."""
    parser = _TextExtractor()
    parser.feed(markup or "")
    parser.close()
    text = html.unescape(" ".join(parser.parts))
    return re.sub(r"\s+", " ", text).strip()


def normalise_phenotype(value: Optional[str]) -> str:
    return re.sub(r"\s+", " ", (value or "").lower().replace("_", " ")).strip()


def phenotype_key(normalised: str) -> Optional[str]:
    """normal | ultrarapid | rapid | poor | intermediate | non expresser | None (unrecognised)."""
    text = normalised.replace("likely ", "").replace("-", " ").replace("ultra rapid", "ultrarapid")
    if re.search(r"\bnon ?expresser\b", text):
        return "non expresser"
    if "normal" in text:
        return "normal"
    for key in ("ultrarapid", "rapid", "poor", "intermediate"):
        if PHENOTYPE_PATTERNS[key].search(text):
            return key
    return None


def summary_mentions(summary: str, key: str) -> bool:
    text = summary.lower().replace("-", " ").replace("ultra rapid", "ultrarapid")
    return bool(PHENOTYPE_PATTERNS[key].search(text))


def load_inhibitors() -> List[Dict[str, Any]]:
    return json.loads(INHIBITOR_FILE.read_text(encoding="utf-8"))["inhibitors"]


def title_case(name: str) -> str:
    return name.title()


def _parse_raw(raw: Optional[str]) -> Dict[str, Any]:
    """Returns {recommendation: bool|None, version: str|None, updated: str|None}."""
    out: Dict[str, Any] = {"recommendation": None, "version": None, "updated": None}
    try:
        guideline = json.loads(raw or "")["guideline"]
        rec = guideline.get("recommendation")
        out["recommendation"] = rec if isinstance(rec, bool) else None
        if guideline.get("version") is not None:
            out["version"] = str(guideline["version"])
        history = guideline.get("history") or []
        if history:
            out["updated"] = str(history[-1].get("date", ""))[:10] or None
    except Exception:
        pass
    return out


def parse_pmids(value: Any) -> List[int]:
    """Parses '{123,456}'; malformed tokens are skipped."""
    try:
        text = str(value or "").strip().strip("{}")
        out = []
        for token in text.split(","):
            token = token.strip().strip('"')
            if token.isdigit():
                out.append(int(token))
        return out
    except Exception:
        return []


class ReviewEngine:
    def __init__(
        self,
        rules_repo: RulesSource,
        literature_repo: Optional[LiteratureSource] = None,
        inhibitors: Optional[List[Dict[str, Any]]] = None,
    ):
        self._rules_repo = rules_repo
        self._literature_repo = literature_repo
        self._inhibitors = inhibitors if inhibitors is not None else load_inhibitors()

    # ---- medication search -------------------------------------------------

    def search_medications(self, query: str = "", limit: int = 15) -> List[Dict[str, str]]:
        names = set()
        for row in self._rules_repo.get_rules():
            if any(g.upper() in SUPPORTED_GENES for g in row["genes"]):
                names.update(row["chemicals"])
        names.update(i["drug"].lower() for i in self._inhibitors)
        q = query.strip().lower()
        if q:
            prefix = sorted(n for n in names if n.startswith(q))
            substring = sorted(n for n in names if q in n and not n.startswith(q))
            ordered = prefix + substring
        else:
            ordered = sorted(names)
        return [{"id": n, "name": title_case(n)} for n in ordered[:limit]]

    # ---- assessment --------------------------------------------------------

    def assess(self, request: AssessRequest) -> Dict[str, Any]:
        """Returns {patientId, medications, verdict} as plain pydantic models."""
        meds = [(m.id, m.name.strip().lower()) for m in request.medications]
        med_names = [n for _, n in meds]

        phenotypes: Dict[str, Tuple[str, Any, Optional[str]]] = {}
        for g in request.genotypes:
            gene = g.gene.strip().upper()
            norm = normalise_phenotype(g.phenotype)
            if gene in SUPPORTED_GENES and norm:
                phenotypes[gene] = (norm, g, g.diplotype)

        rules = [
            r
            for r in self._rules_repo.get_rules()
            if any(g.upper() in SUPPORTED_GENES for g in r["genes"])
        ]
        candidates: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
        for med in sorted(set(med_names)):
            for gene in SUPPORTED_GENES:
                rows = [r for r in rules if gene.lower() in r["genes"] and med in r["chemicals"]]
                if rows:
                    candidates[(gene, med)] = rows
        raw = self._rules_repo.get_raw_json({r["guideline_id"] for rows in candidates.values() for r in rows})
        meta = {gid: _parse_raw(text) for gid, text in raw.items()}

        # recommendation-true rows only, with plain-text summaries attached
        pairs: Dict[Tuple[str, str], List[Dict[str, Any]]] = {}
        for key, rows in candidates.items():
            good = [
                {**r, "summary": plain_text(r["summary_html"]), "meta": meta.get(r["guideline_id"], {})}
                for r in sorted(rows, key=lambda r: (r["source"], r["guideline_id"]))
                if meta.get(r["guideline_id"], {}).get("recommendation") is True
            ]
            if good:
                pairs[key] = good

        checks: List[CheckItem] = []
        missing: List[str] = []
        limitations: List[str] = ["Only CYP2D6, CYP2C19, CYP2C9 and CYP3A5 are evaluated."]
        limitations.append("Guideline text is quoted as published; this engine gives no dosing or prescribing advice.")
        assoc_specs: List[Dict[str, Any]] = []  # in deterministic order
        cited: Dict[str, Dict[str, Any]] = {}

        for (gene, med), rows in sorted(pairs.items(), key=lambda kv: (kv[0][1], kv[0][0])):
            label = f"{gene} × {title_case(med)}"
            if gene not in phenotypes:
                missing.append(f"{gene} result is not available for this patient (needed for {title_case(med)}).")
                checks.append(CheckItem(label=label, note=f"{gene} not tested", missing=True))
                continue
            norm, _, _ = phenotypes[gene]
            key = phenotype_key(norm)
            if key is None:
                missing.append(f"{gene} phenotype '{norm}' could not be interpreted (needed for {title_case(med)}).")
                checks.append(CheckItem(label=label, note=f"{gene} phenotype not interpretable", missing=True))
                continue
            if key == "normal":
                checks.append(CheckItem(label=label, note=f"{gene} {norm}: {NO_ACTIONABLE}", missing=False))
                if NORMAL_LIMITATION not in limitations:
                    limitations.append(NORMAL_LIMITATION)
                continue
            actionable = [r for r in rows if summary_mentions(r["summary"], key)]
            if not actionable:
                checks.append(CheckItem(label=label, note=f"{gene} {norm}: {NO_ACTIONABLE}", missing=False))
                continue
            checks.append(CheckItem(label=label, note=f"{gene} {norm}: guideline entry found", missing=False))
            assoc_specs.append(
                {"kind": "gene_drug", "gene": gene, "med": med, "inhibitor": None, "rows": actionable, "rule": f"GG-{gene}-{med.upper()}"}
            )
            for r in actionable:
                cited[r["guideline_id"]] = r

        # Demo inhibitor rule
        mechanism: Optional[List[FlowNode]] = None
        for gene in SUPPORTED_GENES:
            if gene not in phenotypes:
                continue
            norm, genotype, diplotype = phenotypes[gene]
            if phenotype_key(norm) == "poor":
                continue
            for inhibitor in sorted({i["drug"].lower() for i in self._inhibitors if i["gene"] == gene}):
                if inhibitor not in med_names:
                    continue
                for med in sorted(set(med_names)):
                    if med == inhibitor or (gene, med) not in pairs:
                        continue
                    rows = pairs[(gene, med)]
                    quote_row = rows[0]
                    assoc_specs.append(
                        {
                            "kind": "gene_drug_drug",
                            "gene": gene,
                            "med": med,
                            "inhibitor": inhibitor,
                            "rows": [quote_row],
                            "rule": f"GDD-{gene}-{inhibitor.upper()}-{med.upper()}",
                        }
                    )
                    cited[quote_row["guideline_id"]] = quote_row
                    if mechanism is None:
                        score = getattr(genotype, "activityScore", None)
                        sub = norm + (f" · activity score {score:.1f}" if score is not None else "")
                        mechanism = [
                            FlowNode(kind="gene", label="Patient genotype", title=f"{gene} {diplotype or ''}".strip(), sub=sub),
                            FlowNode(kind="inhibitor", label="Inhibitor on list", title=title_case(inhibitor), sub=f"{DEMO_LABEL}."),
                            FlowNode(kind="substrate", label="Substrate", title=title_case(med), sub=f"Listed in guideline entries for {gene}."),
                            FlowNode(
                                kind="effect",
                                label="Guideline text (quoted)",
                                title=f"{quote_row['source']}: {quote_row['name']}",
                                sub=f"“{quote_row['summary']}”",
                            ),
                        ]
                    if DEMO_LABEL + "." not in limitations:
                        limitations.append(f"{DEMO_LABEL}.")

        references = [
            EvidenceReference(
                source=r["source"],
                citation=r["name"],
                guidelineId=r["guideline_id"],
                annotationVersion=r["meta"].get("version"),
                lastUpdated=r["meta"].get("updated"),
                quote=r["summary"],
            )
            for r in sorted(cited.values(), key=lambda r: (r["source"], r["guideline_id"]))
        ]

        associations = [self._association(spec) for spec in assoc_specs]
        if assoc_specs:
            status, basis = "association_found", "Guideline-supported"
        elif missing:
            status, basis = "insufficient_evidence", "Incomplete input"
        else:
            status, basis = "no_documented_association", "Rule set searched"

        if not checks:
            checks = [
                CheckItem(label=title_case(m), note="No guideline entries for the supported genes in the rule set", missing=False)
                for m in sorted(set(med_names))
            ]

        rule_ids = [a.ruleId for a in associations]
        verdict = ClinicalVerdict(
            evidenceStatus=status,
            summary=self._summary(status, associations, missing),
            references=references,
            limitations=limitations,
            mechanism=mechanism,
            checks=checks,
            missingData=missing or None,
            associations=associations or None,
            evidenceBasis=basis,
            ruleId=rule_ids[0] if rule_ids else None,
            engineVersion=ENGINE_VERSION,
            evidenceSnapshot=EVIDENCE_SNAPSHOT,
        )
        return {
            "patientId": request.patientId,
            "medications": [MedicationOut(id=i, name=m.name) for (i, _), m in zip(meds, request.medications)],
            "verdict": verdict,
        }

    # ---- helpers -----------------------------------------------------------

    @staticmethod
    def _summary(status: str, associations: List[Association], missing: List[str]) -> str:
        if status == "association_found":
            items = "; ".join(
                f"{a.gene} × {title_case(a.medication)}" + (f" (with {title_case(a.inhibitor)}, demo inhibitor list)" if a.inhibitor else "")
                for a in associations
            )
            return f"Guideline entries matching this patient's phenotype were found for: {items}. Quoted text is shown under evidence references."
        if status == "insufficient_evidence":
            return "No matching guideline entry was found for the results on file, and at least one gene needed for these medications has no usable result. This is not a finding of no association."
        return "No documented association was found in the guideline rule set searched for this patient's results and medication list."

    def _association(self, spec: Dict[str, Any]) -> Association:
        return Association(
            ruleId=spec["rule"],
            kind=spec["kind"],
            gene=spec["gene"],
            medication=spec["med"],
            inhibitor=spec["inhibitor"],
            guidelineIds=[r["guideline_id"] for r in spec["rows"]],
            literature=self._literature(spec["gene"], spec["med"]),
        )

    def _literature(self, gene: str, med: str) -> Optional[List[LiteratureLink]]:
        """Related reading only; never influences the verdict."""
        if self._literature_repo is None:
            return None
        try:
            rows = self._literature_repo.get_pair_rows(gene, med)
        except Exception:
            return None
        pmids = set()
        for row in rows:
            if row.get("association") == "associated":
                pmids.update(parse_pmids(row.get("pmids")))
        top = sorted(pmids, reverse=True)[:MAX_LITERATURE]
        return [LiteratureLink(pmid=str(p), url=f"https://pubmed.ncbi.nlm.nih.gov/{p}/") for p in top] or None
