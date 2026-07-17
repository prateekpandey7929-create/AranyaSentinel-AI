import logging
from fastapi import APIRouter, HTTPException, status
from typing import List

from .history_models import AnalysisHistoryItem, TrendResponse
from .history_utils import get_all_history, get_history_by_id
from .history_service import compile_historical_trends

router = APIRouter()
logger = logging.getLogger("backend")

@router.get("/", response_model=List[AnalysisHistoryItem], status_code=status.HTTP_200_OK)
async def get_all_historical_analyses():
    """
    Returns all historical analysis records.
    """
    logger.info("Fetching all historical records")
    return get_all_history()

@router.get("/latest", response_model=AnalysisHistoryItem, status_code=status.HTTP_200_OK)
async def get_latest_analysis():
    """
    Returns the latest analysis record.
    """
    logger.info("Fetching latest historical record")
    records = get_all_history()
    if not records:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No historical records found.")
    
    # newest is at index 0 because data is inserted at 0
    return records[0]

@router.get("/trends", response_model=TrendResponse, status_code=status.HTTP_200_OK)
async def get_analysis_trends():
    """
    Returns compiled trends across time.
    """
    logger.info("Compiling historical trends")
    return compile_historical_trends()

@router.get("/{analysis_id}", response_model=AnalysisHistoryItem, status_code=status.HTTP_200_OK)
async def get_analysis_by_id(analysis_id: str):
    """
    Returns a specific complete analysis record.
    """
    logger.info(f"Fetching historical record ID: {analysis_id}")
    record = get_history_by_id(analysis_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Analysis ID {analysis_id} not found.")
    return record
