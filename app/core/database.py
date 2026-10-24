from functools import lru_cache
from supabase import create_client, Client
from app.core.config import settings

@lru_cache() # stads for least recently used. this gives thread safe singleton behavior without it being tightly coupled
def get_supabase_client() -> Client:
    # get_supabase_client is the dependency provider
    #! always use dependency injection
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)