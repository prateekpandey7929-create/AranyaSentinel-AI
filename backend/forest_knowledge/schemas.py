from pydantic import BaseModel, Field
from typing import List

class ForestKnowledgeRequest(BaseModel):
    latitude: float = Field(..., description="Latitude coordinate of query point")
    longitude: float = Field(..., description="Longitude coordinate of query point")

class ForestKnowledgeResponse(BaseModel):
    status: str = Field("success", description="Response status message")
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
