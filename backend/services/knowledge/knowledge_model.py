from pydantic import BaseModel, Field
from typing import List, Optional

class KnowledgeBaseModel(BaseModel):
    forest_id: str = Field(..., description="Unique identifier for the forest")
    forest_name: str = Field(..., description="Full name of the forest")
    overview: str = Field(..., description="General overview and description")
    
    # Location details
    state: str = Field(..., description="State where the forest is located")
    district: str = Field(..., description="District where the forest is located")
    country: str = Field(default="India", description="Country")
    
    # Geography & Stats
    area_sq_km: float = Field(..., description="Total area in square kilometers")
    established_year: int = Field(..., description="Year the protected area was established")
    elevation_meters: str = Field(..., description="Elevation range in meters")
    
    # Classifications
    forest_type: str = Field(..., description="Type of forest (e.g., Tropical Moist Deciduous)")
    protected_status: str = Field(..., description="E.g., National Park, Tiger Reserve, Wildlife Sanctuary")
    unesco_status: Optional[str] = Field(default=None, description="UNESCO World Heritage status if applicable")
    
    # Climate
    climate: str = Field(..., description="Climate type (e.g., Subtropical)")
    average_rainfall_mm: float = Field(..., description="Average annual rainfall in mm")
    
    # Flora & Fauna (Species)
    major_trees: List[str] = Field(default_factory=list, description="Major tree species")
    vegetation_type: str = Field(..., description="Description of the vegetation")
    major_animals: List[str] = Field(default_factory=list, description="Major animal species")
    bird_species: List[str] = Field(default_factory=list, description="Prominent bird species")
    threatened_species: List[str] = Field(default_factory=list, description="Vulnerable or near-threatened species")
    endangered_species: List[str] = Field(default_factory=list, description="Endangered species")
    
    # Ecosystem
    rivers: List[str] = Field(default_factory=list, description="Rivers flowing through or nearby")
    ecological_importance: str = Field(..., description="Why this ecosystem is critical")
    
    # Human & Tourism
    tourism_importance: str = Field(..., description="Tourism significance and main attractions")
    interesting_facts: List[str] = Field(default_factory=list, description="Trivia and interesting facts")
    
    last_updated: str = Field(..., description="ISO Date string of last update")

class KnowledgeOverviewModel(BaseModel):
    forest_id: str
    forest_name: str
    state: str
    area_sq_km: float
    protected_status: str
    overview: str
