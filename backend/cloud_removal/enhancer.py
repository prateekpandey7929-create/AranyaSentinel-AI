import numpy as np
import cv2
import logging

logger = logging.getLogger("backend")

def enhance_bands(bands: dict, clip_limit: float = 2.0, grid_size: int = 8) -> dict:
    """
    Enhances satellite band images using edge-preserving bilateral filtering (noise reduction)
    and CLAHE (Contrast Limited Adaptive Histogram Equalization) for contrast correction.
    Maintains raw band data ranges while improving visual and analytical quality.
    """
    if bands is None:
        return {}

    enhanced_bands = {}
    try:
        # Create CLAHE object
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(grid_size, grid_size))

        for band_name in ['B2', 'B3', 'B4', 'B8']:
            band_data = bands[band_name].copy()

            # 1. Noise Reduction / Denoising using Bilateral Filter (edge-preserving)
            # cv2.bilateralFilter works on float32 arrays directly
            # d=5 (pixel neighborhood), sigmaColor=0.1, sigmaSpace=5.0
            # Since band values can be large (e.g. 0-10000), let's normalize range before filtering
            min_val = float(np.min(band_data))
            max_val = float(np.max(band_data))
            
            if max_val > min_val:
                # Normalize to [0, 1] for bilateral filter stability
                norm_data = (band_data - min_val) / (max_val - min_val)
                filtered_norm = cv2.bilateralFilter(norm_data.astype(np.float32), d=5, sigmaColor=0.1, sigmaSpace=5.0)
                
                # 2. Local Contrast Correction using CLAHE
                # Convert [0, 1] back to [0, 255] uint8 for CLAHE
                scaled_uint8 = (filtered_norm * 255.0).astype(np.uint8)
                enhanced_uint8 = clahe.apply(scaled_uint8)
                
                # Scale back to original raw float32 range
                enhanced_band = (enhanced_uint8.astype(np.float32) / 255.0) * (max_val - min_val) + min_val
                enhanced_bands[band_name] = enhanced_band
            else:
                enhanced_bands[band_name] = band_data

        logger.info("Atmospheric correction, noise reduction, and CLAHE enhancement completed successfully.")
        return enhanced_bands
    except Exception as e:
        logger.error(f"Error in image enhancement: {e}. Returning input bands.")
        return bands
