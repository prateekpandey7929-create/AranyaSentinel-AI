from pydantic import BaseModel, Field
from typing import Dict, Any

class SeasonVerificationRequest(BaseModel):
    latitude: float = Field(..., description="Latitude coordinate of region centroid")
    longitude: float = Field(..., description="Longitude coordinate of region centroid")
    month: int = Field(..., description="Target analysis month (1-12)")
    forest_loss_percentage: float = Field(..., description="Forest loss percentage from U-Net")
    encroachment_count: int = Field(..., description="YOLO building detections count")
    current_ndvi: float = Field(..., description="Average post-change NDVI value")

class WeatherSummary(BaseModel):
    season: str = Field(..., description="Identified season name")
    temp: float = Field(..., description="Temperature in Celsius")
    rainfall: float = Field(..., description="Rainfall in millimeters")

class NdviComparison(BaseModel):
    current: float = Field(..., description="Current observed NDVI average")
    historical_average: float = Field(..., description="Historical baseline average NDVI")
    historical_min: float = Field(..., description="Historical minimum NDVI for this month")
    historical_max: float = Field(..., description="Historical maximum NDVI for this month")

class SeasonVerificationResponse(BaseModel):
    status: str = Field("success", description="Response status message")
    classification: str = Field(..., description="Verification result (Natural Seasonal Change / Actual Deforestation)")
    confidence_score: float = Field(..., description="Verification confidence score (percentage)")
    explanation: str = Field(..., description="AI ecological diagnosis explanation text")
    weather: WeatherSummary = Field(..., description="Meteorological indicators")
    ndvi_comparison: NdviComparison = Field(..., description="Historical NDVI baselines comparison stats")
