import numpy as np
import logging

logger = logging.getLogger("backend")

def calculate_vegetation_score(ndvi_after: np.ndarray) -> float:
    """
    Calculates the Vegetation Health Score on a 0-100 scale using NDVI values.
    A higher NDVI indicates healthier, denser vegetation.
    """
    if ndvi_after is None or not isinstance(ndvi_after, np.ndarray) or ndvi_after.size == 0:
        logger.warning("Invalid or missing ndvi_after array. Returning default Vegetation Score of 50.0")
        return 50.0

    try:
        # Filter out NaN/inf values just in case
        valid_ndvi = ndvi_after[np.isfinite(ndvi_after)]
        if valid_ndvi.size == 0:
            return 50.0
            
        mean_ndvi = float(np.mean(valid_ndvi))
        
        # NDVI ranges from -1.0 to 1.0. For vegetation, we map [0.0, 0.8] to [0.0, 100.0]
        # values <= 0.0 map to 0 (non-vegetation/water), >= 0.8 map to 100 (dense forest canopy)
        score = (mean_ndvi / 0.8) * 100.0
        return float(max(0.0, min(100.0, round(score, 2))))
    except Exception as e:
        logger.error(f"Error calculating vegetation score: {e}. Returning default 50.0")
        return 50.0

def calculate_density_score(change_mask: np.ndarray) -> float:
    """
    Estimates Forest Density Score on a 0-100 scale using U-Net change mask results.
    We compute the percentage of area that remains intact (not deforested).
    """
    if change_mask is None or not isinstance(change_mask, np.ndarray) or change_mask.size == 0:
        logger.warning("Invalid or missing change_mask. Returning default Density Score of 50.0")
        return 50.0

    try:
        # change_mask is True (or 255) for deforested pixels, False (or 0) for intact forest pixels
        total_pixels = change_mask.size
        loss_pixels = int(np.sum(change_mask > 0))
        
        loss_percentage = (loss_pixels / total_pixels) * 100.0
        # Intact density score
        score = 100.0 - loss_percentage
        return float(max(0.0, min(100.0, round(score, 2))))
    except Exception as e:
        logger.error(f"Error calculating density score: {e}. Returning default 50.0")
        return 50.0

def calculate_loss_score(forest_loss_pct: float) -> float:
    """
    Calculates Forest Loss Score on a 0-100 scale from the forest loss percentage.
    Higher loss percentage significantly reduces this score.
    """
    if forest_loss_pct is None or not isinstance(forest_loss_pct, (int, float)):
        logger.warning("Invalid or missing forest_loss_pct. Returning default Loss Score of 50.0")
        return 50.0

    try:
        # A forest loss of 20% or more is considered extremely severe, mapping to 0.0.
        score = 100.0 - (forest_loss_pct * 5.0)
        return float(max(0.0, min(100.0, round(score, 2))))
    except Exception as e:
        logger.error(f"Error calculating loss score: {e}. Returning default 50.0")
        return 50.0

def calculate_human_activity_score(num_detections: int) -> float:
    """
    Calculates Human Activity Score on a 0-100 scale based on YOLOv8 encroachment detections.
    Each detection represents a disturbance (buildings, illegal constructions), decreasing the score.
    """
    if num_detections is None or not isinstance(num_detections, int):
        logger.warning("Invalid or missing num_detections. Returning default Human Activity Score of 100.0")
        return 100.0

    try:
        # Each building detection reduces score by 10 points. 10+ detections = 0 score.
        score = 100.0 - (num_detections * 10.0)
        return float(max(0.0, min(100.0, round(score, 2))))
    except Exception as e:
        logger.error(f"Error calculating human activity score: {e}. Returning default 100.0")
        return 100.0

def calculate_water_availability_score(bands: dict, ndvi_after: np.ndarray) -> float:
    """
    Calculates Water Availability Score on a 0-100 scale using Green/NIR bands (NDWI)
    and NDVI as a vegetation moisture proxy.
    """
    # Fallback to NDVI if bands are missing
    has_bands = bands is not None and 'B3' in bands and 'B8' in bands
    has_ndvi = ndvi_after is not None and isinstance(ndvi_after, np.ndarray) and ndvi_after.size > 0

    if not has_bands and not has_ndvi:
        logger.warning("Both bands and NDVI are missing. Returning default Water Availability Score of 50.0")
        return 50.0

    try:
        ndvi_score = 50.0
        if has_ndvi:
            valid_ndvi = ndvi_after[np.isfinite(ndvi_after)]
            if valid_ndvi.size > 0:
                mean_ndvi = float(np.mean(valid_ndvi))
                ndvi_score = max(0.0, min(100.0, mean_ndvi * 100.0))

        ndwi_score = 50.0
        if has_bands:
            green = bands['B3']
            nir = bands['B8']
            
            # NDWI = (Green - NIR) / (Green + NIR)
            denom = green + nir
            denom = np.where(denom == 0.0, 1e-6, denom)
            ndwi = (green - nir) / denom
            
            valid_ndwi = ndwi[np.isfinite(ndwi)]
            if valid_ndwi.size > 0:
                mean_ndwi = float(np.mean(valid_ndwi))
                # NDWI typically ranges from -0.5 (very dry) to 0.1+ (moist/water).
                # Let's map [-0.5, 0.1] to [0.0, 100.0]
                ndwi_score = ((mean_ndwi + 0.5) / 0.6) * 100.0
                ndwi_score = max(0.0, min(100.0, ndwi_score))

        # Weighted combination: 60% vegetation moisture (NDVI) + 40% surface/soil moisture (NDWI)
        score = 0.6 * ndvi_score + 0.4 * ndwi_score
        return float(round(score, 2))
    except Exception as e:
        logger.error(f"Error calculating water availability score: {e}. Returning default 50.0")
        return 50.0

def calculate_fire_risk_score(ndvi_after: np.ndarray, water_score: float) -> float:
    """
    Calculates Fire Risk Score (represented as Fire Safety: 100 is lowest risk, 0 is highest risk)
    using vegetation dryness (inverse of water availability) and vegetation density (NDVI).
    """
    has_ndvi = ndvi_after is not None and isinstance(ndvi_after, np.ndarray) and ndvi_after.size > 0
    has_water = water_score is not None and isinstance(water_score, (int, float))

    if not has_ndvi and not has_water:
        logger.warning("NDVI and water score are missing. Returning default Fire Risk Score of 50.0")
        return 50.0

    try:
        # Dryness factor (0 to 1, higher means drier/more fire risk)
        dryness = 1.0 - (water_score / 100.0) if has_water else 0.5
        
        # Vegetation factor: Lower NDVI indicates dry/dead vegetation or sparse cover,
        # which increases fire risk in dry conditions.
        veg_factor = 0.5
        if has_ndvi:
            valid_ndvi = ndvi_after[np.isfinite(ndvi_after)]
            if valid_ndvi.size > 0:
                mean_ndvi = float(np.mean(valid_ndvi))
                # Map NDVI [0.1, 0.7] to [1.0 (very dry/at risk), 0.0 (lush green/safe)]
                veg_factor = 1.0 - ((mean_ndvi - 0.1) / 0.6)
                veg_factor = max(0.0, min(1.0, veg_factor))

        # Risk Index combines dryness and dry vegetation fuel presence
        risk_index = (0.6 * dryness + 0.4 * veg_factor) * 100.0
        
        # Score is inverse of risk: 100 (completely safe), 0 (critical fire risk)
        score = 100.0 - risk_index
        return float(max(0.0, min(100.0, round(score, 2))))
    except Exception as e:
        logger.error(f"Error calculating fire risk score: {e}. Returning default 50.0")
        return 50.0
