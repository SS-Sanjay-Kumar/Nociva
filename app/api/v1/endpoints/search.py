from fastapi import APIRouter, Depends, Query
from typing import List, Dict, Any
from app.core.database import get_supabase_client
from supabase import Client

router = APIRouter()

@router.get("/search", response_model=Dict[str, List[str]])
def search_drugs(
    q: str = Query(..., min_length=1, description="Search query for drugs"),
    supabase: Client = Depends(get_supabase_client)
):
    """
    Allows frontend search bars to query available drugs instantly.
    """
    # Query distinct chemical names from entity_relationships table matching search query
    response = supabase.table("entity_relationships") \
        .select("entity2_name") \
        .eq("entity2_type", "Chemical") \
        .ilike("entity2_name", f"%{q}%") \
        .limit(10) \
        .execute()
    
    # Extract unique drug names
    matches = list(set([row["entity2_name"] for row in response.data if row.get("entity2_name")]))
    
    return {"matches": matches}