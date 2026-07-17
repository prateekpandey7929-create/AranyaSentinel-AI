from dataclasses import dataclass
from typing import Dict

@dataclass
class ForestHealthData:
    """
    Internal domain model holding calculated forest health metrics.
    """
    vegetation_health: float
    forest_density: float
    forest_loss: float
    human_activity: float
    water_availability: float
    fire_risk: float
    overall_score: float
    category: str
    explanation: str
    indices: Dict[str, float]

    def to_dict(self) -> Dict:
        return {
            "forest_health_score": self.overall_score,
            "health_category": self.category,
            "explanation": self.explanation,
            "metrics": {
                "vegetation_health": self.vegetation_health,
                "forest_density": self.forest_density,
                "forest_loss": self.forest_loss,
                "human_activity": self.human_activity,
                "water_availability": self.water_availability,
                "fire_risk": self.fire_risk
            },
            "health_score": int(self.overall_score),
            "health_status": self.category,
            "indices": self.indices
        }
