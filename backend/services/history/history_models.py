from pydantic import BaseModel, Field
from typing import List, Optional

class OutputFiles(BaseModel):
    heatmap: Optional[str] = None
    change_mask: Optional[str] = None
    combined_result: Optional[str] = None
    before_rgb: Optional[str] = None
    after_rgb: Optional[str] = None

class AnalysisHistoryItem(BaseModel):
    id: str = Field(..., description="Unique Analysis ID")
    date: str = Field(..., description="Date of analysis in ISO or readable format")
    forest_name: str = Field(..., description="Name of the forest or ROI")
    forest_loss_percentage: float = Field(..., description="Percentage of forest lost")
    forest_health_score: int = Field(..., description="Calculated health score out of 100")
    ndvi: float = Field(..., description="Average NDVI difference or absolute value")
    severity: str = Field(..., description="High, Medium, or Low")
    illegal_structures: int = Field(..., description="Count of detected encroachments")
    human_activity_score: int = Field(..., description="Score based on YOLO detections (0-100)")
    output_files: OutputFiles
    status: str = Field(..., description="Analysis completion status")

class TrendPoint(BaseModel):
    date: str
    value: float

class TrendResponse(BaseModel):
    forest_loss_trend: List[TrendPoint]
    ndvi_trend: List[TrendPoint]
    health_trend: List[TrendPoint]
    severity_trend: List[TrendPoint]
    human_activity_trend: List[TrendPoint]
