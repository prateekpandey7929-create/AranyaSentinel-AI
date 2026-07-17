import logging
from season_verification.ndvi_history import get_historical_ndvi_stats
from season_verification.weather_service import resolve_weather_data

logger = logging.getLogger("backend")

def verify_season_impact(
    lat: float, 
    lon: float, 
    month: int, 
    forest_loss_pct: float, 
    encroachments: int, 
    current_ndvi: float
) -> dict:
    """
    Evaluates satellite metrics against historical weather and NDVI baselines.
    Returns:
        classification: "Natural Seasonal Change" or "Actual Deforestation"
        confidence: float percentage
        explanation: human-readable explanation
        weather: dict of resolved meteorological parameters
        ndvi_comparison: dict showing current vs historical average
    """
    logger.info("Running Season-Aware False Positive Decision Engine...")
    
    # 1. Fetch reference stats
    weather = resolve_weather_data(lat, lon, month)
    hist_ndvi = get_historical_ndvi_stats(lat, lon, month)
    
    # Defaults
    classification = "Actual Deforestation"
    confidence = 70.0
    explanation = ""

    # Ensure current_ndvi is clean float
    if current_ndvi is None or np_isnan_check(current_ndvi):
        current_ndvi = hist_ndvi["avg"]  # Fallback

    # 2. Decision Logic Rules
    # Rule 1: Encroachment is absolute proof of deforestation
    if encroachments > 0:
        classification = "Actual Deforestation"
        confidence = float(min(98.0, 90.0 + encroachments * 2.0))
        explanation = (
            f"Actual Deforestation confirmed with {confidence:.1f}% confidence. "
            f"The YOLOv8 object detection engine identified {encroachments} building encroachment(s) "
            f"inside the forest boundary, which cannot be caused by seasonal variations."
        )

    # Rule 2: Excessive canopy loss is proof of deforestation
    elif forest_loss_pct > 40.0:
        classification = "Actual Deforestation"
        confidence = float(min(95.0, 85.0 + (forest_loss_pct - 40.0) * 0.2))
        explanation = (
            f"Actual Deforestation confirmed with {confidence:.1f}% confidence. "
            f"The canopy loss area ({forest_loss_pct:.1f}%) is extremely severe and far exceeds the "
            f"maximum expected leaf-shedding or natural thinning baseline."
        )

    # Rule 3: Wet season (Monsoon) drops indicate deforestation
    elif weather["season"] == "Monsoon (Wet)":
        classification = "Actual Deforestation"
        confidence = 85.0
        explanation = (
            f"Actual Deforestation confirmed with {confidence:.1f}% confidence. "
            f"Vegetation loss was detected during the wet monsoon season (Rainfall: {weather['rainfall']}mm) "
            f"when tropical deciduous forests experience leaf flushing and peak greenness."
        )

    # Rule 4: Summer dry leaf shedding (March - May)
    elif month in [3, 4, 5]:
        # If current NDVI is within standard deviation or above min historical
        if current_ndvi >= (hist_ndvi["min"] - 0.05):
            classification = "Natural Seasonal Change"
            
            # Confidence is higher if it matches historical average closely
            deviation = abs(current_ndvi - hist_ndvi["avg"])
            confidence = float(max(75.0, 95.0 - (deviation * 100.0)))
            
            explanation = (
                f"Natural Seasonal Change detected with {confidence:.1f}% confidence. "
                f"Vegetation reduction aligns with the natural deciduous leaf shedding cycle. "
                f"Central India experiences dry summer conditions in Month {month} (Temp: {weather['temp']}°C, "
                f"Rainfall: {weather['rainfall']}mm). Current NDVI ({current_ndvi:.2f}) matches the historical "
                f"dry season average ({hist_ndvi['avg']:.2f})."
            )
        else:
            # NDVI is too low even for dry summer
            classification = "Actual Deforestation"
            confidence = 78.0
            explanation = (
                f"Actual Deforestation suspected with {confidence:.1f}% confidence. "
                f"Although the analysis took place during the dry season, the current NDVI ({current_ndvi:.2f}) "
                f"is significantly lower than the historical minimum expected value ({hist_ndvi['min']:.2f})."
            )

    # Rule 5: Winter cool season
    else:
        # Winter deciduous shedding is minor
        if current_ndvi >= hist_ndvi["min"]:
            classification = "Natural Seasonal Change"
            confidence = 80.0
            explanation = (
                f"Natural Seasonal Change detected with {confidence:.1f}% confidence. "
                f"Minor leaf thinning corresponds to typical winter dry conditions "
                f"(Temp: {weather['temp']}°C, Rainfall: {weather['rainfall']}mm). "
                f"NDVI ({current_ndvi:.2f}) is within standard seasonal bounds."
            )
        else:
            classification = "Actual Deforestation"
            confidence = 82.0
            explanation = (
                f"Actual Deforestation confirmed with {confidence:.1f}% confidence. "
                f"The observed vegetation decline is significantly below the expected winter historical average "
                f"({hist_ndvi['avg']:.2f}) and standard minimum ({hist_ndvi['min']:.2f})."
            )

    logger.info(f"Seasonal Verification Outcome: Result={classification}, Confidence={confidence:.1f}%")

    return {
        "classification": classification,
        "confidence": round(confidence, 2),
        "explanation": explanation,
        "weather": weather,
        "ndvi_comparison": {
            "current": round(float(current_ndvi), 3),
            "historical_average": round(float(hist_ndvi["avg"]), 3),
            "historical_min": round(float(hist_ndvi["min"]), 3),
            "historical_max": round(float(hist_ndvi["max"]), 3)
        }
    }

def np_isnan_check(val):
    import numpy as np
    try:
        return np.isnan(val)
    except:
        return False
