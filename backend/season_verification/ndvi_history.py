import logging
import numpy as np

logger = logging.getLogger("backend")

# Typical monthly NDVI baseline values for deciduous forests in Central India (e.g. Madhya Pradesh)
# Peak greenness in monsoon, drop in dry summer (March-May) due to leaf shedding.
CENTRAL_INDIA_NDVI_BASELINE = {
    1:  {"avg": 0.55, "std": 0.04, "min": 0.47, "max": 0.63},  # Jan
    2:  {"avg": 0.48, "std": 0.04, "min": 0.40, "max": 0.56},  # Feb
    3:  {"avg": 0.35, "std": 0.05, "min": 0.25, "max": 0.45},  # Mar (Leaf shedding peak)
    4:  {"avg": 0.32, "std": 0.05, "min": 0.22, "max": 0.42},  # Apr (Dry summer)
    5:  {"avg": 0.33, "std": 0.04, "min": 0.25, "max": 0.41},  # May (Dry summer)
    6:  {"avg": 0.42, "std": 0.06, "min": 0.30, "max": 0.54},  # Jun (Pre-monsoon rains)
    7:  {"avg": 0.68, "std": 0.05, "min": 0.58, "max": 0.78},  # Jul (Monsoon greenup)
    8:  {"avg": 0.75, "std": 0.04, "min": 0.67, "max": 0.83},  # Aug (Peak wet season)
    9:  {"avg": 0.76, "std": 0.04, "min": 0.68, "max": 0.84},  # Sep (Peak wet season)
    10: {"avg": 0.70, "std": 0.05, "min": 0.60, "max": 0.80},  # Oct (Post-monsoon transition)
    11: {"avg": 0.64, "std": 0.04, "min": 0.56, "max": 0.72},  # Nov (Dry winter start)
    12: {"avg": 0.60, "std": 0.04, "min": 0.52, "max": 0.68},  # Dec (Cool winter)
}

def get_historical_ndvi_stats(lat: float, lon: float, month: int) -> dict:
    """
    Retrieves historical NDVI statistics for the given coordinates and month.
    Uses regional deciduous forest baseline parameters for Central India.
    """
    # Clamp month to valid range
    month = max(1, min(12, int(month)))
    
    # Retrieve base stats
    stats = CENTRAL_INDIA_NDVI_BASELINE.get(month).copy()
    
    # Apply minor adjustments based on location (lat/lon coordinates) to simulate spatial variance
    # Example: Areas further south/west tend to be slightly drier (lower baseline)
    spatial_offset = (lat - 22.0) * 0.01 + (lon - 80.0) * 0.005
    stats["avg"] = float(np.clip(stats["avg"] + spatial_offset, 0.1, 0.9))
    stats["min"] = float(np.clip(stats["min"] + spatial_offset, 0.05, 0.85))
    stats["max"] = float(np.clip(stats["max"] + spatial_offset, 0.15, 0.95))
    
    logger.info(f"Historical NDVI baseline calculated for coordinates ({lat}, {lon}) in Month {month}: "
                f"Avg: {stats['avg']:.2f}, Range: [{stats['min']:.2f} - {stats['max']:.2f}]")
                
    return stats
