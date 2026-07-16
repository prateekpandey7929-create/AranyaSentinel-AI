import numpy as np

def calculate_ndvi(bands):
    """
    Calculates Normalized Difference Vegetation Index (NDVI) from Sentinel-2 bands.
    NDVI = (NIR - Red) / (NIR + Red)
    NIR is B8, Red is B4.
    """
    nir = bands['B8']
    red = bands['B4']
    
    # Avoid division by zero warnings
    denominator = nir + red
    denominator = np.where(denominator == 0.0, 1e-6, denominator)
    
    ndvi = (nir - red) / denominator
    # NDVI values should be strictly within [-1.0, 1.0]
    ndvi = np.clip(ndvi, -1.0, 1.0)
    return ndvi

def calculate_ndvi_difference(ndvi_before, ndvi_after):
    """
    Calculates NDVI Difference = NDVI Before - NDVI After.
    A positive difference indicates loss of vegetation cover (deforestation).
    """
    return ndvi_before - ndvi_after
