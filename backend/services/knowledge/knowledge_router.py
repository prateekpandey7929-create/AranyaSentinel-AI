import logging
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict

from .knowledge_model import KnowledgeBaseModel, KnowledgeOverviewModel
from .knowledge_service import (
    fetch_all_forests,
    fetch_forest_details,
    search_forests,
    fetch_overviews,
    fetch_all_species
)

router = APIRouter()
logger = logging.getLogger("backend")

@router.get("/", response_model=List[KnowledgeBaseModel], status_code=status.HTTP_200_OK)
async def get_all_knowledge():
    """Returns complete information for all forests."""
    return fetch_all_forests()

@router.get("/overview", response_model=List[KnowledgeOverviewModel], status_code=status.HTTP_200_OK)
async def get_knowledge_overviews():
    """Returns lightweight overview for all forests."""
    return fetch_overviews()

@router.get("/species", response_model=Dict[str, List[str]], status_code=status.HTTP_200_OK)
async def get_knowledge_species():
    """Returns aggregated species lists across all forests."""
    return fetch_all_species()

@router.get("/search", response_model=List[KnowledgeBaseModel], status_code=status.HTTP_200_OK)
async def search_knowledge(q: str):
    """Searches forest knowledge base."""
    if not q:
        return []
    return search_forests(q)

@router.get("/{forest_name}", response_model=KnowledgeBaseModel, status_code=status.HTTP_200_OK)
async def get_specific_forest(forest_name: str):
    """Returns complete information for a specific forest."""
    forest = fetch_forest_details(forest_name)
    if not forest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Forest '{forest_name}' not found in Knowledge Base.")
    return forest
