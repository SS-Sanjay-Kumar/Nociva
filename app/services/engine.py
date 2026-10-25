from typing import List, Dict, Any
from app.repositories.relation_repo import RelationRepository
from app.repositories.guideline_repo import GuidelineRepository
from app.repositories.variant_repo import VariantRepository

class DeterministicEngineService:
    def __init__(
        self,
        relation_repo: RelationRepository,
        guideline_repo: GuidelineRepository,
        variant_repo: VariantRepository
    ):
        self.relation_repo = relation_repo
        self.guideline_repo = guideline_repo
        self.variant_repo = variant_repo

    def evaluate(self, patient_genotypes: Dict[str, str], drug_cocktail: List[str]) -> Dict[str, Any]:
        """
        Executes the deterministic multi-drug metabolic collision and bottleneck evaluation engine.
        Runs entirely on set-intersection math and database lookups with zero AI hallucination risk.
        """
        if not drug_cocktail:
            return {
                "evaluation_status": "SAFE",
                "input_drugs": [],
                "detected_bottlenecks": [],
                "clinical_guidelines": []
            }

        # Step 1: Fetch gene-drug relationships from Supabase
        relations = self.relation_repo.get_relationships_by_drugs(drug_cocktail)

        # Step 2: Build enzyme-to-drugs mapping (Resource Contention / Set Intersection)
        enzyme_drug_map: Dict[str, set] = {}
        
        for row in relations:
            entity1_name = row.get("entity1_name")
            entity1_type = row.get("entity1_type")
            entity2_name = row.get("entity2_name")
            entity2_type = row.get("entity2_type")

            gene = None
            drug = None

            # Map Gene vs Chemical connections
            if entity1_type == "Gene" and entity2_type == "Chemical":
                gene = entity1_name
                drug = entity2_name
            elif entity2_type == "Gene" and entity1_type == "Chemical":
                gene = entity2_name
                drug = entity1_name

            # Verify if the drug is part of our input cocktail (case-insensitive check)
            if gene and drug:
                matching_input_drug = next(
                    (d for d in drug_cocktail if d.lower() == drug.lower()), None
                )
                if matching_input_drug:
                    if gene not in enzyme_drug_map:
                        enzyme_drug_map[gene] = set()
                    enzyme_drug_map[gene].add(matching_input_drug)

        # Step 3: Detect bottlenecks and evaluate patient genetic capacity
        detected_bottlenecks = []
        overall_status = "SAFE"
        collected_guidelines = []
        seen_guideline_ids = set()

        for enzyme, drugs in enzyme_drug_map.items():
            competing_list = list(drugs)
            
            # Bottleneck condition: More than one drug competing for the same enzyme
            if len(competing_list) > 1:
                patient_phenotype = patient_genotypes.get(enzyme, "Normal Metabolizer")
                
                # Deterministic risk escalation based on phenotype capacity
                if "poor" in patient_phenotype.lower():
                    risk_level = "CRITICAL"
                    overall_status = "CRITICAL_COLLISION"
                elif "intermediate" in patient_phenotype.lower():
                    risk_level = "HIGH"
                    if overall_status != "CRITICAL_COLLISION":
                        overall_status = "HIGH_RISK_COLLISION"
                else:
                    risk_level = "MODERATE"
                    if overall_status == "SAFE":
                        overall_status = "MODERATE_COLLISION"

                mechanism = (
                    f"Enzyme {enzyme} is congested by {len(competing_list)} concurrent substrates "
                    f"while patient genetic capacity is '{patient_phenotype}'."
                )

                detected_bottlenecks.append({
                    "enzyme": enzyme,
                    "competing_drugs": competing_list,
                    "patient_phenotype": patient_phenotype,
                    "risk_level": risk_level,
                    "mechanism": mechanism
                })

                # Step 4: Fetch official clinical guidelines from Supabase
                for drug_item in competing_list:
                    guidelines = self.guideline_repo.get_guidelines_by_gene_and_drug(enzyme, drug_item)
                    for g in guidelines:
                        g_id = g.get("guideline_id")
                        if g_id and g_id not in seen_guideline_ids:
                            seen_guideline_ids.add(g_id)
                            collected_guidelines.append({
                                "guideline_id": g_id,
                                "source": g.get("source", "CPIC/DPWG"),
                                "recommendation_summary": g.get("summary_html", "No summary provided.")
                            })

        return {
            "evaluation_status": overall_status,
            "input_drugs": drug_cocktail,
            "detected_bottlenecks": detected_bottlenecks,
            "clinical_guidelines": collected_guidelines
        }