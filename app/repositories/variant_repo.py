from typing import List, Dict, Any
from supabase import Client
from app.core.database import get_supabase_client

class VariantRepository:
    def __init__(self, supabase: Client = None):
        self.supabase = supabase or get_supabase_client()

    def get_high_evidence_variants(self, gene: str, drug: str) -> List[Dict[str, Any]]:
        """
        fetches clinical variants supporting a gene-drug pair filtered by high evidence (1A/1B)
        from the 'clinical_variants' table
        """
        response = self.supabase.table("clinical_variants") \
            .select("id, variant, gene, type, level_of_evidence, chemicals, phenotypes") \
            .eq("gene", gene) \
            .in_("level_of_evidence", ["1A", "1B"]) \
            .execute()
        
        filtered_results = [
            row for row in response.data 
            if row.get("chemicals") and drug.lower() in row.get("chemicals", "").lower()
        ]
        
        return filtered_results