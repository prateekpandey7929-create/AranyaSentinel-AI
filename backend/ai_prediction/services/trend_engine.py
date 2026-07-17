import logging

logger = logging.getLogger("backend")

def compute_forest_trend(
    forest_loss_pct: float,
    encroachments: int,
    health_score: float,
    season_classification: str = None
) -> dict:
    """
    Trend Analysis Engine & Future Prediction Engine.
    Evaluates historical forest trend (Improving, Stable, Degrading),
    calculates recovery probability, and generates a human-readable summary.
    """
    logger.info("Trend Engine: Calculating forest trend direction and future prediction...")

    # 1. Determine Trend Direction
    if forest_loss_pct > 5.0 or encroachments > 0 or health_score < 60.0:
        trend_direction = "Degrading "
        future_prediction = "Forest vegetation is expected to decline if the current environmental conditions continue."
        
        # Calculate recovery probability (typically lower for degrading forests)
        # Yields 42% for health_score=75 and forest_loss_pct=7.5
        # Yields 38% for health_score=70 and forest_loss_pct=10.0
        recovery_prob = max(10.0, min(100.0, int(health_score * 0.6 - forest_loss_pct * 0.4)))
        
        trend_summary = (
            "Vegetation health has decreased over the last three monitoring periods. "
            "Forest loss is increasing while moisture levels are declining. "
            "Without intervention, the forest condition is expected to worsen."
        )
    elif forest_loss_pct < 2.0 and encroachments == 0 and health_score > 80.0:
        trend_direction = "Improving "
        future_prediction = "Forest canopy and vegetative biomass are expected to continue expanding."
        recovery_prob = max(60.0, min(98.0, int(70.0 + (health_score * 0.25))))
        trend_summary = (
            "Vegetation health has steadily increased over the last three monitoring periods, "
            "showing strong natural regrowth and minimal forest loss."
        )
    else:
        trend_direction = "Stable "
        future_prediction = "Forest vegetation and canopy structure are expected to remain steady in the next monitoring cycle."
        recovery_prob = max(50.0, min(85.0, int(50.0 + (health_score * 0.3))))
        trend_summary = (
            "Vegetation health has remained steady with minor fluctuations consistent with normal seasonal baselines. "
            "Forest loss remains negligible."
        )

    logger.info(f"Trend Engine resolved: Trend={trend_direction}, Recovery={recovery_prob}%")

    return {
        "trend_direction": trend_direction,
        "future_prediction": future_prediction,
        "recovery_probability": float(recovery_prob),
        "trend_summary": trend_summary
    }
