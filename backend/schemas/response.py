from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List

class OutputFiles(BaseModel):
    before_rgb: str = Field(..., description="Static URL/path for Before RGB image")
    after_rgb: str = Field(..., description="Static URL/path for After RGB image")
    heatmap: str = Field(..., description="Static URL/path for Heatmap overlay image")
    change_mask: str = Field(..., description="Static URL/path for Change Mask image")
    combined_result: str = Field(..., description="Static URL/path for 2x2 combined dashboard image")

class SeasonVerificationDetail(BaseModel):
    classification: str = Field(..., description="Verification result (Natural Seasonal Change / Actual Deforestation)")
    confidence_score: float = Field(..., description="Verification confidence score (percentage)")
    explanation: str = Field(..., description="AI ecological diagnosis explanation text")
    weather_summary: str = Field(..., description="Text summary of weather conditions")
    historical_ndvi_average: float = Field(..., description="Historical average NDVI value")

class ForestKnowledgeDetail(BaseModel):
    name: str = Field(..., description="Name of the forest region")
    forest_type: str = Field(..., description="Ecological forest type category")
    protected_status: str = Field(..., description="IUCN / National protected status details")
    district: str = Field(..., description="Administrative district name")
    state: str = Field(..., description="State name")
    country: str = Field(..., description="Country name")
    geographical_location: str = Field(..., description="Specific geographical ranges / hills description")
    climate: str = Field(..., description="Climatic zone and temperatures description")
    annual_rainfall: str = Field(..., description="Average annual precipitation")
    major_vegetation: str = Field(..., description="General vegetation mix description")
    dominant_tree_species: List[str] = Field(..., description="List of primary dominant tree types")
    biodiversity: str = Field(..., description="Biodiversity index rating description")
    important_flora_and_fauna: str = Field(..., description="Key wildlife and plant species list")
    ecological_importance: str = Field(..., description="Carbon capture and watershed importance description")
    nearby_water_bodies: str = Field(..., description="Nearby rivers, dams, or lakes")
    why_famous: str = Field(..., description="What the park/forest is famous for")

class AIPredictionDetail(BaseModel):
    prediction: str = Field(..., description="Resolved prediction category name")
    reason: str = Field(..., description="AI diagnosis of why the change occurred")
    severity: str = Field(..., description="Severity classification status (Critical, High, Moderate, Low)")
    confidence_score: float = Field(..., description="System confidence score percentage")
    suggested_actions: List[str] = Field(..., description="Actionable checklist of recommendations")
    ai_summary: str = Field(..., description="Comprehensive natural language summary")
    trend_direction: Optional[str] = Field(None, description="Forest trend direction (Improving , Stable , Degrading )")
    future_prediction: Optional[str] = Field(None, description="Rule-based expectation of forest condition in the next cycle")
    recovery_probability: Optional[float] = Field(None, description="Probability percentage of natural recovery (0 to 100)")
    trend_summary: Optional[str] = Field(None, description="Human-readable trend history and future expectation details")
class AnalyzeResponse(BaseModel):
    forest_loss_percentage: float = Field(..., description="Percentage of forest loss detected")
    changed_area_hectares: float = Field(..., description="Deforested area in Hectares")
    severity_score: str = Field(..., description="Severity classification (Low/Medium/High)")
    encroachment_count: int = Field(..., description="Number of building encroachments detected")
    average_unet_confidence: float = Field(..., description="Average U-Net prediction confidence")
    average_yolo_confidence: float = Field(..., description="Average YOLOv8 detection confidence")
    output_files: OutputFiles = Field(..., description="Web-accessible links/paths to all generated imagery")
    cloud_coverage_percentage: float = Field(..., description="Detected cloud cover percentage")
    cloud_warning: Optional[str] = Field(None, description="Warning warning message if clouds are moderate")
    season_verification: Optional[SeasonVerificationDetail] = Field(None, description="Season-aware false positive verification results")
    forest_knowledge: Optional[ForestKnowledgeDetail] = Field(None, description="Detailed encyclopedic metadata about the queried forest region")
    ai_prediction: Optional[AIPredictionDetail] = Field(None, description="AI-generated prediction and action recommendations")

class ConfigSeverity(BaseModel):
    low: float
    medium: float

class ConfigThresholds(BaseModel):
    ndvi_loss_threshold: float
    unet_threshold: float
    yolo_conf: float
    morphology_kernel_size: int
    severity: ConfigSeverity

class ConfigGee(BaseModel):
    dataset: str
    max_cloud_percentage: float
    scale: int

class ConfigRoi(BaseModel):
    name: str
    lat: float
    lon: float
    buffer_degree: float

class ConfigDateRange(BaseModel):
    start: str
    end: str

class ConfigDates(BaseModel):
    before: ConfigDateRange
    after: ConfigDateRange

class ConfigResponse(BaseModel):
    gee: ConfigGee
    roi: ConfigRoi
    dates: ConfigDates
    thresholds: ConfigThresholds
