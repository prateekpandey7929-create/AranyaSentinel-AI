import os
import sys
import ee

# Resolve absolute path to project root to import 'src'
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(BASE_DIR, 'src'))

# Import existing verified downloader
from gee_download import download_gee_image

def download_satellite_images(roi_geojson, roi_latlon, before_dates, after_dates, config):
    """
    Exposes Sentinel-2 GEE downloader interface to the API.
    Resolves geometry from request parameters and downloads Before and After TIFFs.
    """
    # 1. Resolve geometry
    if roi_geojson:
        print("Resolving ROI from GeoJSON geometry...")
        # If it contains Feature/FeatureCollection wrappers, extract raw geometry dict
        geom = roi_geojson
        if roi_geojson.get("type") == "FeatureCollection":
            geom = roi_geojson.get("features", [])[0].get("geometry", {})
        elif roi_geojson.get("type") == "Feature":
            geom = roi_geojson.get("geometry", {})
            
        geometry = ee.Geometry(geom)
    elif roi_latlon:
        print(f"Resolving ROI from Lat/Lon bounding box around lat={roi_latlon.lat}, lon={roi_latlon.lon}...")
        lat = roi_latlon.lat
        lon = roi_latlon.lon
        buf = roi_latlon.buffer_degree
        geometry = ee.Geometry.Rectangle([lon - buf, lat - buf, lon + buf, lat + buf])
    else:
        # Bounding box fallback from config
        print("No ROI specified in request. Using default coordinates from config...")
        lat = config['roi']['lat']
        lon = config['roi']['lon']
        buf = config['roi']['buffer_degree']
        geometry = ee.Geometry.Rectangle([lon - buf, lat - buf, lon + buf, lat + buf])

    # 2. Download Before Image
    print("Downloading BEFORE image...")
    download_gee_image(
        geometry=geometry,
        start_date=before_dates.start,
        end_date=before_dates.end,
        config=config,
        output_name="before"
    )

    # 3. Download After Image
    print("Downloading AFTER image...")
    download_gee_image(
        geometry=geometry,
        start_date=after_dates.start,
        end_date=after_dates.end,
        config=config,
        output_name="after"
    )
    
    print("GEE download completed successfully.")
    return True
