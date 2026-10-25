from typing import List, Dict, Any
from supabase import Client
from app.core.database import get_supabase_client

class GuidelineRepository:
    def __init__(self, supabase: Client = None):
        self.supabase = supabase or get_supabase_client()

    def get_guidelines_by_gene_and_drug(self, gene: str, drug: str) -> List[Dict[str, Any]]:
        """
        queries 'guideline_rules' matching a specific gene and chemical
        sses text filtering since related_genes and related_chemicals are TEXT columns
        """
        response = self.supabase.table("guideline_rules") \
            .select("guideline_id, source, summary_html, related_genes, related_chemicals") \
            .ilike("related_genes", f"%{gene}%") \
            .ilike("related_chemicals", f"%{drug}%") \
            .execute()
        
        return response.data