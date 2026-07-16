from pydantic import BaseModel, Field
from typing import Dict, Any

class OutputFiles(BaseModel):
    before_rgb: str = Field(..., description="Static URL/path for Before RGB image")
    after_rgb: str = Field(..., description="Static URL/path for After RGB image")
    heatmap: str = Field(..., description="Static URL/path for Heatmap overlay image")
    change_mask: str = Field(..., description="Static URL/path for Change Mask image")
    combined_result: str = Field(..., description="Static URL/path for 2x2 combined dashboard image")

class AnalyzeResponse(BaseModel):
    forest_loss_percentage: float = Field(..., description="Percentage of forest loss detected")
    changed_area_hectares: float = Field(..., description="Deforested area in Hectares")
    severity_score: str = Field(..., description="Severity classification (Low/Medium/High)")
    encroachment_count: int = Field(..., description="Number of building encroachments detected")
    average_unet_confidence: float = Field(..., description="Average U-Net prediction confidence")
    average_yolo_confidence: float = Field(..., description="Average YOLOv8 detection confidence")
    output_files: OutputFiles = Field(..., description="Web-accessible links/paths to all generated imagery")

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
