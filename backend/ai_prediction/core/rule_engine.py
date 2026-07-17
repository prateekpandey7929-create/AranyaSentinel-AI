import logging

logger = logging.getLogger("backend")

def evaluate_rules(forest_loss_pct: float, encroachments: int, health_score: float, season_classification: str = None) -> dict:
    """
    Evaluates rule conditions based on metrics to determine the prediction category,
    base severity rating, and base confidence rating.
    """
    logger.info("Rule Engine: Evaluating classification and severity...")
    
    # 1. Encroachments detected
    if encroachments > 0:
        return {
            "prediction": "Illegal Encroachment & Forest Loss",
            "severity": "Critical",
            "base_confidence": 95.0
        }
    
    # 2. Season Verification confirms natural drop
    elif season_classification == "Natural Seasonal Change":
        return {
            "prediction": "Natural Seasonal Vegetation Change",
            "severity": "Low",
            "base_confidence": 90.0
        }

    # 3. High loss but no human structures detected
    elif forest_loss_pct > 15.0:
        return {
            "prediction": "Deforestation Alarm (Potential Logging)",
            "severity": "High",
            "base_confidence": 85.0
        }

    # 4. Low health score
    elif health_score < 50.0:
        return {
            "prediction": "Canopy Ecological Health Decline",
            "severity": "Moderate",
            "base_confidence": 80.0
        }

    # 5. Default: Healthy
    else:
        return {
            "prediction": "Canopy Stable & Healthy",
            "severity": "Low",
            "base_confidence": 96.0
        }
