from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Dict, Any, List

from .translation_service import (
    get_ui_translations,
    get_available_languages,
    set_global_language,
    get_global_language
)

router = APIRouter()

class LanguagePreferenceRequest(BaseModel):
    language: str

@router.get("/languages", response_model=List[str], status_code=status.HTTP_200_OK)
async def list_languages():
    """Returns all supported languages."""
    return get_available_languages()

@router.get("/translations/{lang}", response_model=Dict[str, Any], status_code=status.HTTP_200_OK)
async def get_translations(lang: str):
    """Returns the translation JSON for a specific language."""
    data = get_ui_translations(lang)
    if not data:
        # Fallback to English if translation is completely missing
        data = get_ui_translations("en")
    return data

@router.post("/preference", status_code=status.HTTP_200_OK)
async def update_language_preference(request: LanguagePreferenceRequest):
    """Updates the global backend language preference for report generation."""
    lang = set_global_language(request.language)
    return {"status": "success", "active_language": lang}

@router.get("/preference", status_code=status.HTTP_200_OK)
async def get_language_preference():
    """Returns the current backend language preference."""
    return {"active_language": get_global_language()}
