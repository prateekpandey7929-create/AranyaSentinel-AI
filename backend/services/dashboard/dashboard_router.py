from fastapi import APIRouter, status
from services.dashboard.dashboard_schemas import PlatformStatistics, OverviewResponse, WorkflowResponse
from services.dashboard.dashboard_service import get_platform_statistics, get_workflow_steps

router = APIRouter()

@router.get("/overview", response_model=OverviewResponse, status_code=status.HTTP_200_OK)
async def get_overview():
    return {
        "status": "success",
        "greeting": "Welcome to AranyaSentinel AI",
        "description": "AI-Powered Forest Monitoring & Geospatial Intelligence Platform"
    }

@router.get("/statistics", response_model=PlatformStatistics, status_code=status.HTTP_200_OK)
async def get_statistics():
    return get_platform_statistics()

@router.get("/workflow", response_model=WorkflowResponse, status_code=status.HTTP_200_OK)
async def get_workflow():
    return {
        "steps": get_workflow_steps()
    }
