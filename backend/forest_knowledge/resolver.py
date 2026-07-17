import time
import logging
from forest_knowledge.forest_db import FORESTS_SPATIAL_DB, get_fallback_forest_profile

logger = logging.getLogger("backend")

def resolve_forest_knowledge(lat: float, lon: float) -> dict:
    """
    Looks up coordinates against the geospatial database of protected forests.
    Falls back to regional profile builders if outside major boundaries.
    Never raises exceptions, returns a valid metadata dictionary.
    """
    start_time = time.time()
    try:
        # Validate coordinates input
        if lat is None or lon is None:
            logger.warning("Coordinates are missing. Returning generic fallback profile.")
            return get_fallback_forest_profile(22.0, 80.0)

        logger.info(f"Resolving forest knowledge for coordinates ({lat:.4f}, {lon:.4f})...")

        # Loop through DB to find a spatial match
        for forest in FORESTS_SPATIAL_DB:
            min_lat, max_lat, min_lon, max_lon = forest["bbox"]
            if min_lat <= lat <= max_lat and min_lon <= lon <= max_lon:
                logger.info(f"Spatial match found in database: {forest['key']} ({forest['data']['name']}).")
                duration = time.time() - start_time
                logger.info(f"Forest knowledge resolved in {duration:.4f}s.")
                return forest["data"]

        # If no spatial match found, load regional fallback profile
        logger.info("No spatial match found in database. Loading regional bioclimatic fallback profile.")
        fallback = get_fallback_forest_profile(lat, lon)
        duration = time.time() - start_time
        logger.info(f"Forest knowledge resolved (fallback) in {duration:.4f}s.")
        return fallback

    except Exception as e:
        logger.error(f"Unexpected error in forest knowledge resolver: {e}. Returning default profile.")
        return get_fallback_forest_profile(22.334, 80.611)  # safe default
