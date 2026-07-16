from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime

class DateRange(BaseModel):
    start: str = Field(..., description="Start date in YYYY-MM-DD format")
    end: str = Field(..., description="End date in YYYY-MM-DD format")

    @validator("start", "end")
    def validate_date_format(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Dates must be in YYYY-MM-DD format")
        return v

class LatLonROI(BaseModel):
    lat: float = Field(..., description="Center latitude", ge=-90.0, le=90.0)
    lon: float = Field(..., description="Center longitude", ge=-180.0, le=180.0)
    buffer_degree: float = Field(0.02, description="Bounding box size buffer", gt=0.0, le=1.0)

class AnalyzeRequest(BaseModel):
    before_dates: DateRange = Field(..., description="Before date range")
    after_dates: DateRange = Field(..., description="After date range")
    roi_latlon: Optional[LatLonROI] = Field(None, description="Center Lat/Lon configuration (used if geojson is null)")
    roi_geojson: Optional[Dict[str, Any]] = Field(None, description="GeoJSON Polygon geometry (highest priority)")

    @validator("after_dates")
    def validate_date_ranges(cls, v, values):
        if "before_dates" in values:
            before = values["before_dates"]
            before_start = datetime.strptime(before.start, "%Y-%m-%d")
            before_end = datetime.strptime(before.end, "%Y-%m-%d")
            after_start = datetime.strptime(v.start, "%Y-%m-%d")
            after_end = datetime.strptime(v.end, "%Y-%m-%d")

            if before_start >= before_end:
                raise ValueError("Before start date must be earlier than before end date")
            if after_start >= after_end:
                raise ValueError("After start date must be earlier than after end date")
            if before_end >= after_start:
                raise ValueError("Before date range must end before After date range starts")
        return v

    @validator("roi_geojson")
    def validate_geojson(cls, v):
        if v is not None:
            # Check basic GeoJSON structure
            if "type" not in v:
                raise ValueError("GeoJSON must contain 'type' field")
            
            geom = v
            if v["type"] == "FeatureCollection":
                features = v.get("features", [])
                if not features:
                    raise ValueError("FeatureCollection must contain at least one feature")
                geom = features[0].get("geometry", {})
            elif v["type"] == "Feature":
                geom = v.get("geometry", {})
            
            if not geom or "type" not in geom or "coordinates" not in geom:
                raise ValueError("Invalid GeoJSON geometry structure. Coordinates required.")
            if geom["type"] not in ["Polygon", "MultiPolygon"]:
                raise ValueError("Only Polygon or MultiPolygon geometry types are supported for ROI GeoJSON")
        return v
