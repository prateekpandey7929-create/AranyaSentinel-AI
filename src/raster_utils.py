import os
import rasterio
from rasterio.enums import Resampling
import numpy as np
import cv2

def load_geotiff(tif_path, target_size=(256, 256)):
    """
    Loads a 4-band GeoTIFF file using rasterio.
    Resizes it to target_size (default 256x256) to ensure consistent shape.
    Bands read order: 1: Blue, 2: Green, 3: Red, 4: NIR.
    Returns:
        bands: dict containing numpy arrays of the bands.
        profile: rasterio profile adjusted to target_size.
    """
    if not os.path.exists(tif_path):
        raise FileNotFoundError(f"GeoTIFF file not found: {tif_path}")

    bands = {}
    with rasterio.open(tif_path) as src:
        # Read and resize bands using bilinear resampling
        # Order: band 1 = Blue (B2), 2 = Green (B3), 3 = Red (B4), 4 = NIR (B8)
        data = src.read(
            out_shape=(src.count, target_size[0], target_size[1]),
            resampling=Resampling.bilinear
        )
        
        bands['B2'] = data[0].astype(np.float32)
        bands['B3'] = data[1].astype(np.float32)
        bands['B4'] = data[2].astype(np.float32)
        bands['B8'] = data[3].astype(np.float32)

        # Copy and update profile
        profile = src.profile.copy()
        transform = rasterio.transform.from_bounds(
            *src.bounds, target_size[1], target_size[0]
        )
        profile.update({
            'height': target_size[0],
            'width': target_size[1],
            'transform': transform
        })

    return bands, profile

def convert_to_8bit_rgb(bands):
    """
    Converts raw 16-bit satellite bands (B4=Red, B3=Green, B2=Blue) to 8-bit RGB.
    Uses 2% and 98% percentile clipping to boost contrast and prevent washed-out colors.
    """
    rgb_channels = []
    # Process Red (B4), Green (B3), Blue (B2)
    for band_name in ['B4', 'B3', 'B2']:
        band_data = bands[band_name]
        
        # Calculate 2nd and 98th percentiles
        valid_data = band_data[np.isfinite(band_data)]
        if len(valid_data) == 0:
            rgb_channels.append(np.zeros_like(band_data, dtype=np.uint8))
            continue
            
        p2, p98 = np.percentile(valid_data, (2, 98))
        
        # Clip band values
        clipped = np.clip(band_data, p2, p98)
        
        # Normalize to [0, 1]
        if p98 > p2:
            normalized = (clipped - p2) / (p98 - p2)
        else:
            normalized = np.zeros_like(clipped)
            
        # Scale to [0, 255] and convert to uint8
        band_8bit = (normalized * 255).astype(np.uint8)
        rgb_channels.append(band_8bit)

    # Stack channels into a 3D numpy array (H, W, 3) -> RGB format
    rgb_image = np.stack(rgb_channels, axis=-1)
    return rgb_image

def save_rgb_image(rgb_image, out_path):
    """
    Saves RGB image as a PNG/JPG file.
    Note: cv2 expects BGR format, so we convert from RGB first.
    """
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    bgr_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)
    cv2.imwrite(out_path, bgr_image)
    print(f"Saved RGB image to: {out_path}")

def save_single_band_geotiff(data, profile, out_path):
    """
    Saves a single 2D float32 band (e.g. NDVI) as a GeoTIFF.
    """
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    profile.update(dtype=rasterio.float32, count=1)
    with rasterio.open(out_path, 'w', **profile) as dst:
        dst.write(data.astype(np.float32), 1)
    print(f"Saved single band GeoTIFF to: {out_path}")
