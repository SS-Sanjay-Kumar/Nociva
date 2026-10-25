from typing import List, Dict, Any
from supabase import Client
from app.core.database import get_supabase_client

class RelationRepository:
    def __init__(self, supabase: Client = None):
        self.supabase = supabase or get_supabase_client()

    def get_relationships_by_drugs(self, drug_list: List[str]) -> List[Dict[str, Any]]:
        """
        fetches gene-drug relationships from 'entity_relationships' table for a given list of medications
        matches drugs against entity1_name or entity2_name
        """
        if not drug_list:
            return []

        # Construct safe PostgREST OR filter string
        # Example: entity1_name.ilike.Codeine,entity2_name.ilike.Codeine,entity1_name.ilike.Citalopram...
        conditions = []
        for drug in drug_list:
            safe_drug = drug.strip()
            conditions.append(f"entity1_name.ilike.%{safe_drug}%")
            conditions.append(f"entity2_name.ilike.%{safe_drug}%")
        
        or_filter = ",".join(conditions)

        response = self.supabase.table("entity_relationships") \
            .select("entity1_id, entity1_name, entity1_type, entity2_id, entity2_name, entity2_type, evidence, pk, pd") \
            .or_(or_filter) \
            .execute()
        
        return response.data