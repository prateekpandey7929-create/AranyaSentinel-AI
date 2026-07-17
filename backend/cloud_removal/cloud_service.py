import time
import numpy as np
import logging

from cloud_removal.cloud_detector import detect_clouds
from cloud_removal.gap_filler import fill_gaps
from cloud_removal.enhancer import enhance_bands

logger = logging.getLogger("backend")

def process_monsoon_image(bands: dict, historical_bands: dict = None) -> tuple:
    """
    Coordinates the full AI Cloud Removal & Monsoon Image Enhancement pipeline:
    1. Detects clouds and generates cloud mask.
    2. Performs historical & spatial gap filling to reconstruct cloud regions.
    3. Applies edge-preserving filters and CLAHE to enhance contrast.
    4. Evaluates output quality score.
    Returns:
        enhanced_bands: dict of processed band arrays.
        initial_cloud_mask: binary cloud mask of original image.
        initial_cloud_pct: percentage of clouds in the original image.
        final_cloud_pct: percentage of clouds left after processing (ideally 0%).
        quality_score: Quality category (Excellent, Good, Moderate, Poor).
        processing_time: duration of processing in seconds.
    """
    start_time = time.time()
    logger.info("Executing Cloud Removal & Image Enhancement Pipeline...")

    try:
        # 1. Detect Clouds on original image
        initial_cloud_mask = detect_clouds(bands)
        initial_cloud_pct = float((np.sum(initial_cloud_mask == 255) / initial_cloud_mask.size) * 100.0)
        logger.info(f"Original image cloud cover: {initial_cloud_pct:.2f}%")

        # 2. Gap Filling & Pixel Reconstruction
        filled_bands, remaining_mask = fill_gaps(bands, initial_cloud_mask, historical_bands)

        # 3. Contrast & Detail Enhancement
        enhanced_bands = enhance_bands(filled_bands)

        # 4. Detect Clouds on processed image to check remaining clouds
        final_cloud_mask = detect_clouds(enhanced_bands)
        final_cloud_pct = float((np.sum(final_cloud_mask == 255) / final_cloud_mask.size) * 100.0)
        logger.info(f"Enhanced image remaining cloud cover: {final_cloud_pct:.2f}%")

        # 5. Calculate Image Quality Score based on remaining cloud cover and contrast
        if final_cloud_pct < 5.0:
            quality_score = "Excellent"
        elif final_cloud_pct < 15.0:
            quality_score = "Good"
        elif final_cloud_pct < 35.0:
            quality_score = "Moderate"
        else:
            quality_score = "Poor"

        processing_time = float(time.time() - start_time)
        logger.info(f"Cloud removal pipeline completed in {processing_time:.4f}s. Quality Score: {quality_score}")

        # Warn if cloud coverage remains too high
        if final_cloud_pct > 35.0:
            logger.warning(
                f"High cloud cover warning: Remaining clouds ({final_cloud_pct:.1f}%) exceed threshold. "
                "Downstream analysis may produce unreliable predictions."
            )

        return enhanced_bands, initial_cloud_mask, initial_cloud_pct, final_cloud_pct, quality_score, processing_time
    except Exception as e:
        logger.error(f"Error executing Cloud Removal coordinator: {e}")
        processing_time = float(time.time() - start_time)
        return bands, np.zeros((256, 256), dtype=np.uint8), 0.0, 0.0, "Poor", processing_time
