from typing import List, Dict, Any, Optional
from .knowledge_data import FOREST_KNOWLEDGE_DB
from .knowledge_model import KnowledgeBaseModel

def get_all_forests_data() -> List[Dict[str, Any]]:
    """Returns the raw knowledge DB."""
    return FOREST_KNOWLEDGE_DB

def get_forest_by_id(forest_id: str) -> Optional[Dict[str, Any]]:
    """Fetches a specific forest by its exact ID."""
    for f in FOREST_KNOWLEDGE_DB:
        if f["forest_id"] == forest_id:
            return f
    return None

def search_forests_query(query: str) -> List[Dict[str, Any]]:
    """Searches across forest name, state, and protected status."""
    q = query.lower()
    results = []
    for f in FOREST_KNOWLEDGE_DB:
        if (q in f["forest_name"].lower() or 
            q in f["state"].lower() or 
            q in f["protected_status"].lower()):
            results.append(f)
    return results
