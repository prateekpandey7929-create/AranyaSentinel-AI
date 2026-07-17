import numpy as np
import cv2
import logging

logger = logging.getLogger("backend")

def fill_gaps(bands: dict, cloud_mask: np.ndarray, historical_bands: dict = None) -> tuple:
    """
    Fills gaps (cloud-masked regions marked 255 in cloud_mask) in the band data.
    First tries to replace gaps using historical bands if available and clear.
    Falls back to OpenCV fast marching inpainting (cv2.inpaint) for remaining gaps.
    Returns:
        filled_bands: dict of filled numpy arrays.
        remaining_mask: binary mask of any remaining gaps that could not be filled.
    """
    if bands is None:
        return {}, cloud_mask

    filled_bands = {}
    remaining_mask = cloud_mask.copy()

    try:
        # 1. Historical Gap-Filling
        if historical_bands is not None and all(k in historical_bands for k in ['B2', 'B3', 'B4', 'B8']):
            # Detect clouds in historical bands to ensure we don't copy clouds
            from forest_health.constants import DEFAULT_WEIGHTS  # just to avoid circular imports, let's import locally
            from cloud_removal.cloud_detector import detect_clouds
            
            hist_cloud_mask = detect_clouds(historical_bands)
            
            # Pixels that are cloudy in current, but clear in historical
            fill_mask = (cloud_mask == 255) & (hist_cloud_mask == 0)
            
            if np.any(fill_mask):
                logger.info(f"Filling {np.sum(fill_mask)} pixels using historical reference imagery.")
                for band_name in ['B2', 'B3', 'B4', 'B8']:
                    band_data = bands[band_name].copy()
                    hist_data = historical_bands[band_name]
                    band_data[fill_mask] = hist_data[fill_mask]
                    filled_bands[band_name] = band_data
                
                # Update remaining mask
                remaining_mask[fill_mask] = 0
            else:
                logger.info("No pixels could be filled using historical imagery (historical also cloudy or no overlaps).")
        
        # If no historical fill occurred, copy initial bands
        for band_name in ['B2', 'B3', 'B4', 'B8']:
            if band_name not in filled_bands:
                filled_bands[band_name] = bands[band_name].copy()

        # 2. Spatial Inpainting for any remaining gaps
        if np.any(remaining_mask == 255):
            logger.info("Applying spatial inpainting (Navier-Stokes/Telea) on remaining cloud gaps...")
            
            for band_name in ['B2', 'B3', 'B4', 'B8']:
                band_data = filled_bands[band_name]
                
                # Check for NaNs and replace with median before inpainting
                nan_idx = np.isnan(band_data)
                if np.any(nan_idx):
                    median_val = np.nanmedian(band_data) if not np.all(nan_idx) else 0.0
                    band_data[nan_idx] = median_val
                
                # Normalize band data to [0, 255] range for OpenCV compatibility
                min_val = float(np.min(band_data))
                max_val = float(np.max(band_data))
                
                if max_val > min_val:
                    # Scale to 0-255 uint8
                    scaled = ((band_data - min_val) / (max_val - min_val) * 255.0).astype(np.uint8)
                    
                    # Run OpenCV inpainting
                    inpainted_scaled = cv2.inpaint(scaled, remaining_mask, inpaintRadius=5, flags=cv2.INPAINT_TELEA)
                    
                    # Scale back to original range
                    inpainted_band = (inpainted_scaled.astype(np.float32) / 255.0) * (max_val - min_val) + min_val
                    filled_bands[band_name] = inpainted_band
                else:
                    # Inpaint constant bands
                    filled_bands[band_name] = np.zeros_like(band_data)

            # Inpainting fills all gaps within the image boundary, so remaining mask becomes all-clear
            remaining_mask = np.zeros_like(remaining_mask)
            
        logger.info("Gap filling and pixel reconstruction completed.")
        return filled_bands, remaining_mask
    except Exception as e:
        logger.error(f"Error in gap filling: {e}. Returning original bands.")
        return bands, cloud_mask
