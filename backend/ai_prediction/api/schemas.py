from pydantic import BaseModel, Field
from typing import List, Optional

class AIPredictionRequest(BaseModel):
    forest_loss_percentage: float = Field(..., description="Forest loss percentage from U-Net")
    encroachment_count: int = Field(..., description="YOLOv8 building encroachments count")
    health_score: float = Field(..., description="Forest health score (0-100)")
    season_classification: Optional[str] = Field(None, description="Season verification verdict")
    cloud_coverage_percentage: Optional[float] = Field(0.0, description="Detected cloud cover percentage")

class AIPredictionResponse(BaseModel):
    status: str = Field("success", description="Response status message")
    prediction: str = Field(..., description="Resolved prediction category name")
    reason: str = Field(..., description="AI diagnosis of why the change occurred")
    severity: str = Field(..., description="Severity classification status (Critical, High, Moderate, Low)")
    confidence_score: float = Field(..., description="System confidence score percentage")
    suggested_actions: List[str] = Field(..., description="Actionable checklist of recommendations")
    ai_summary: str = Field(..., description="Comprehensive natural language summary")
    trend_direction: Optional[str] = Field(None, description="Forest trend direction (Improving 📈, Stable ➡️, Degrading 📉)")
    future_prediction: Optional[str] = Field(None, description="Rule-based expectation of forest condition in the next cycle")
    recovery_probability: Optional[float] = Field(None, description="Probability percentage of natural recovery (0 to 100)")
    trend_summary: Optional[str] = Field(None, description="Human-readable trend history and future expectation details")
