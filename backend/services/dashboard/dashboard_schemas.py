from pydantic import BaseModel
from typing import List, Optional

class PlatformStatistics(BaseModel):
    forests_monitored: int
    total_analyses: int
    high_risk_forests: int
    reports_generated: int
    protected_areas_covered: int
    todays_analyses: int
    ai_models_deployed: int
    active_forest_officers: int

class OverviewResponse(BaseModel):
    status: str
    greeting: str
    description: str

class WorkflowStep(BaseModel):
    id: int
    title: str
    description: str
    icon: str

class WorkflowResponse(BaseModel):
    steps: List[WorkflowStep]
