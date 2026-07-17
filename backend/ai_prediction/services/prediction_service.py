import logging
from ai_prediction.core.rule_engine import evaluate_rules
from ai_prediction.core.recommendation import generate_recommendations
from ai_prediction.core.explanation import format_reasoning, build_executive_summary
from ai_prediction.services.trend_engine import compute_forest_trend

logger = logging.getLogger("backend")

def compute_ai_prediction(
    forest_loss_pct: float, 
    encroachments: int, 
    health_score: float, 
    season_classification: str = None,
    cloud_pct: float = 0.0
) -> dict:
    """
    Coordinates modular rules-engine, recommendation-engine, and explanation-formatter
    to yield the final diagnostic package.
    """
    logger.info("Prediction Service: Running unified pipeline analysis...")
    
    # 1. Resolve category & base confidence
    rule_package = evaluate_rules(
        forest_loss_pct=forest_loss_pct,
        encroachments=encroachments,
        health_score=health_score,
        season_classification=season_classification
    )
    
    prediction = rule_package["prediction"]
    severity = rule_package["severity"]
    base_conf = rule_package["base_confidence"]
    
    # Adjust confidence by cloud cover
    cloud_factor = 0.4 if severity == "Critical" else (0.5 if severity == "High" else (0.2 if severity == "Low" else 0.3))
    confidence = float(max(65.0, base_conf - (cloud_pct * cloud_factor)))
    
    # 2. Get recommendations list
    suggested_actions = generate_recommendations(prediction)
    
    # 3. Format reasoning details
    reason = format_reasoning(
        prediction=prediction,
        forest_loss_pct=forest_loss_pct,
        encroachments=encroachments,
        health_score=health_score
    )
    
    # 4. Assemble natural language executive summary
    ai_summary = build_executive_summary(
        reason=reason,
        severity=severity,
        confidence=confidence,
        first_action=suggested_actions[0]
    )
    
    # 5. Compute Trend & Future Prediction
    trend_res = compute_forest_trend(
        forest_loss_pct=forest_loss_pct,
        encroachments=encroachments,
        health_score=health_score,
        season_classification=season_classification
    )
    
    logger.info(f"Prediction Service: Completed. Result = {prediction} ({severity})")
    
    return {
        "prediction": prediction,
        "reason": reason,
        "severity": severity,
        "confidence_score": round(confidence, 2),
        "suggested_actions": suggested_actions,
        "ai_summary": ai_summary,
        "trend_direction": trend_res["trend_direction"],
        "future_prediction": trend_res["future_prediction"],
        "recovery_probability": trend_res["recovery_probability"],
        "trend_summary": trend_res["trend_summary"]
    }
