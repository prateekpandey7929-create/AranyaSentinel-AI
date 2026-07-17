from pydantic import BaseModel, Field
from typing import Dict

class ForestHealthMetrics(BaseModel):
    vegetation_health: float = Field(..., description="Vegetation Health Score (NDVI-based, 30% weight)")
    forest_density: float = Field(..., description="Forest Density Score (U-Net-based, 20% weight)")
    forest_loss: float = Field(..., description="Forest Loss Score (Deforestation-based, 20% weight)")
    human_activity: float = Field(..., description="Human Activity Score (YOLOv8-based, 15% weight)")
    water_availability: float = Field(..., description="Water Availability Score (Moisture index, 10% weight)")
    fire_risk: float = Field(..., description="Fire Risk Score (Fire Safety index, 5% weight)")

class IndicesDetail(BaseModel):
    ndvi: float = Field(..., description="Normalized Difference Vegetation Index (0 to 1)")
    ndmi: float = Field(..., description="Normalized Difference Moisture Index (-1 to 1)")
    ndwi: float = Field(..., description="Normalized Difference Water Index (-1 to 1)")
    nbr: float = Field(..., description="Normalized Burn Ratio (-1 to 1)")
    vv: float = Field(..., description="Sentinel-1 VV backscatter in dB")
    vh: float = Field(..., description="Sentinel-1 VH backscatter in dB")

class ForestHealthResponse(BaseModel):
    forest_health_score: float = Field(..., description="Overall Forest Health Score (0-100)")
    health_category: str = Field(..., description="Health classification (Excellent, Healthy, Moderate, Poor, Critical)")
    explanation: str = Field(..., description="Rule-based natural language explanation of the score")
    metrics: ForestHealthMetrics = Field(..., description="Breakdown of individual metric scores")
    health_score: int = Field(..., description="Flat overall health score")
    health_status: str = Field(..., description="Flat health category string (Excellent/Good/Moderate/Poor/Critical)")
    indices: IndicesDetail = Field(..., description="Breakdown of all remote sensing indices")
