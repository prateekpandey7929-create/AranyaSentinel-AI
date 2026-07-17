import numpy as np
import logging

logger = logging.getLogger("backend")

def detect_clouds(bands: dict, blue_threshold: float = 0.22, ndvi_threshold: float = 0.15) -> np.ndarray:
    """
    Detects cloud pixels in Sentinel-2 bands (B2, B3, B4, B8) and returns a binary mask.
    Mask values: 255 for cloud/masked, 0 for clear pixels.
    Uses QA60 (zeros/NaNs) and spectral heuristics (high Blue reflectance, visible brightness, low NDVI).
    """
    if bands is None or not all(k in bands for k in ['B2', 'B3', 'B4', 'B8']):
        logger.warning("Missing required bands for cloud detection. Returning all-clear mask.")
        return np.zeros((256, 256), dtype=np.uint8)

    try:
        b2 = bands['B2'].copy()
        b3 = bands['B3'].copy()
        b4 = bands['B4'].copy()
        b8 = bands['B8'].copy()

        # Handle NaN values by converting them to 0 and keeping track
        nan_mask = np.isnan(b2) | np.isnan(b3) | np.isnan(b4) | np.isnan(b8)
        b2[np.isnan(b2)] = 0
        b3[np.isnan(b3)] = 0
        b4[np.isnan(b4)] = 0
        b8[np.isnan(b8)] = 0

        # Scale reflectance to [0, 1] range if raw digital numbers (0-10000) are loaded
        max_val = np.max(b2)
        if max_val > 2.0:
            b2_norm = b2 / 10000.0
            b3_norm = b3 / 10000.0
            b4_norm = b4 / 10000.0
            b8_norm = b8 / 10000.0
        else:
            b2_norm = b2
            b3_norm = b3
            b4_norm = b4
            b8_norm = b8

        # 1. QA60 Cloud Mask detection (GEE sets QA60 masked pixels to 0 or NaN)
        # If all visible bands are 0, it means it is a GEE masked pixel
        qa60_mask = (b2 == 0) & (b3 == 0) & (b4 == 0)

        # 2. Spectral heuristic cloud detection
        # Calculate NDVI proxy: (NIR - Red) / (NIR + Red)
        denom = b8_norm + b4_norm
        denom = np.where(denom == 0, 1e-6, denom)
        ndvi = (b8_norm - b4_norm) / denom

        # Clouds are bright in Blue and have low NDVI compared to vegetation
        spectral_cloud = (b2_norm > blue_threshold) & (b4_norm > 0.20) & (ndvi < ndvi_threshold)

        # Combine QA60, NaN, and Spectral detections
        binary_mask = (qa60_mask | nan_mask | spectral_cloud).astype(np.uint8) * 255
        
        # Log detected cloud stats
        cloud_pct = (np.sum(binary_mask == 255) / binary_mask.size) * 100.0
        logger.info(f"Cloud detection complete: {cloud_pct:.2f}% cloud cover detected.")
        
        return binary_mask
    except Exception as e:
        logger.error(f"Error in cloud detection: {e}. Returning all-clear mask.")
        return np.zeros((256, 256), dtype=np.uint8)
