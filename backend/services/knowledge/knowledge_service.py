from typing import List, Dict, Any
from .knowledge_utils import get_all_forests_data, get_forest_by_id, search_forests_query
from .knowledge_model import KnowledgeBaseModel, KnowledgeOverviewModel

def fetch_all_forests() -> List[KnowledgeBaseModel]:
    return [KnowledgeBaseModel(**f) for f in get_all_forests_data()]

def fetch_forest_details(forest_name_or_id: str) -> KnowledgeBaseModel:
    # the frontend might pass the friendly name or the ID. Let's handle both.
    raw_id = forest_name_or_id.lower().replace(" ", "-")
    data = get_forest_by_id(raw_id)
    if not data:
        # Fallback to search if not exact match
        res = search_forests_query(forest_name_or_id)
        if res:
            data = res[0]
    
    if data:
        return KnowledgeBaseModel(**data)
    return None

def search_forests(query: str) -> List[KnowledgeBaseModel]:
    return [KnowledgeBaseModel(**f) for f in search_forests_query(query)]

def fetch_overviews() -> List[KnowledgeOverviewModel]:
    data = get_all_forests_data()
    return [KnowledgeOverviewModel(**f) for f in data]

def fetch_all_species() -> Dict[str, List[str]]:
    """Aggregates all unique species across all forests."""
    trees = set()
    animals = set()
    birds = set()
    
    for f in get_all_forests_data():
        trees.update(f.get("major_trees", []))
        animals.update(f.get("major_animals", []))
        birds.update(f.get("bird_species", []))
        
    return {
        "trees": sorted(list(trees)),
        "animals": sorted(list(animals)),
        "birds": sorted(list(birds))
    }
