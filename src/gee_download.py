import os
import zipfile
import io
import yaml
import requests
import json
import ee
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# Load settings.yaml
def load_config(config_path="config/settings.yaml"):
    with open(config_path, "r") as f:
        return yaml.safe_load(f)

def init_gee():
    print("Initializing Google Earth Engine...")
    project = os.getenv("GEE_PROJECT")
    try:
        if project and project != "your_gee_gcp_project_id_here":
            print(f"Using GEE Project: {project}")
            ee.Initialize(project=project)
        else:
            print("No GEE_PROJECT specified in .env, trying default initialization...")
            ee.Initialize()
        print("Earth Engine initialized successfully!")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to initialize Earth Engine: {e}")
        print("If you are getting a 'no project found' error, please find your Google Cloud Project ID")
        print("associated with Earth Engine and add it to your .env file as:")
        print("  GEE_PROJECT=your-project-id")
        print("Then run this script again.")
        return False

def get_roi_geometry(config):
    geojson_path = config['roi']['geojson_path']
    if os.path.exists(geojson_path):
        print(f"Loading ROI from GeoJSON file: {geojson_path}")
        try:
            with open(geojson_path, "r") as f:
                geojson_data = json.load(f)
            
            # Extract geometry
            if geojson_data['type'] == 'FeatureCollection':
                geom = geojson_data['features'][0]['geometry']
            elif geojson_data['type'] == 'Feature':
                geom = geojson_data['geometry']
            else:
                geom = geojson_data
                
            print("Successfully loaded GeoJSON Polygon.")
            return ee.Geometry(geom)
        except Exception as e:
            print(f"[WARNING] Error reading GeoJSON, falling back to bounding box: {e}")
            
    # Bounding Box fallback
    lat = config['roi']['lat']
    lon = config['roi']['lon']
    buf = config['roi']['buffer_degree']
    print(f"Creating bounding box ROI around lat: {lat}, lon: {lon} (buffer: {buf} deg)...")
    return ee.Geometry.Rectangle([lon - buf, lat - buf, lon + buf, lat + buf])

def download_gee_image(geometry, start_date, end_date, config, output_name):
    dataset_name = config['gee']['dataset']
    max_clouds = config['gee']['max_cloud_percentage']
    scale = config['gee']['scale']

    print(f"Querying {dataset_name} from {start_date} to {end_date} (max clouds: {max_clouds}%)...")
    
    collection = (ee.ImageCollection(dataset_name)
                  .filterBounds(geometry)
                  .filterDate(start_date, end_date)
                  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', max_clouds)))
                  
    count = collection.size().getInfo()
    print(f"Found {count} matching Sentinel-2 images.")
    
    if count == 0:
        raise RuntimeError(f"No images found for period {start_date} to {end_date} with cloud limit {max_clouds}%.")

    # Select the least cloudy image
    image = collection.sort('CLOUDY_PIXEL_PERCENTAGE').first()
    cloud_pct = image.get('CLOUDY_PIXEL_PERCENTAGE').getInfo()
    img_id = image.get('system:index').getInfo()
    print(f"Selected least cloudy image: ID = {img_id} (Cloud Cover: {cloud_pct:.2f}%)")

    # Select bands B2, B3, B4, B8 and apply QA60 cloud masking
    qa = image.select('QA60')
    cloud_bit_mask = 1 << 10
    cirrus_bit_mask = 1 << 11
    
    # 0 in bitmask means clear sky. We mask out values where cloud or cirrus is detected
    clear_sky_mask = qa.bitwiseAnd(cloud_bit_mask).eq(0).And(qa.bitwiseAnd(cirrus_bit_mask).eq(0))
    
    selected_image = image.select(['B2', 'B3', 'B4', 'B8']).updateMask(clear_sky_mask).clip(geometry)

    print(f"Generating download URL for {output_name}...")
    try:
        download_url = selected_image.getDownloadURL({
            'scale': scale,
            'crs': 'EPSG:4326',
            'format': 'GEO_TIFF'
        })
    except Exception as e:
        raise RuntimeError(f"Failed to generate GEE download URL: {e}")

    print(f"Downloading image zip file from GEE...")
    response = requests.get(download_url, stream=True)
    if response.status_code != 200:
        raise RuntimeError(f"GEE server returned error code {response.status_code} during download.")

    content_bytes = response.content
    
    # Check if the content is a direct GeoTIFF file (starts with TIFF magic bytes 'II*' or 'MM*')
    is_tiff = content_bytes.startswith(b'II\x00*') or content_bytes.startswith(b'MM\x00*')
    if is_tiff:
        print("Downloaded content is a direct GeoTIFF file.")
        os.makedirs("outputs", exist_ok=True)
        final_tif_path = os.path.join("outputs", f"{output_name}.tif")
        with open(final_tif_path, 'wb') as f:
            f.write(content_bytes)
        print(f"Saved GeoTIFF directly to: {final_tif_path}")
        return

    if not zipfile.is_zipfile(io.BytesIO(content_bytes)):
        print("[ERROR] Downloaded data is not a zip file. Content preview:")
        try:
            print(content_bytes[:500].decode('utf-8'))
        except:
            print(content_bytes[:500])
        raise RuntimeError("File is not a zip file")

    print(f"Extracting GeoTIFF bands...")
    z = zipfile.ZipFile(io.BytesIO(content_bytes))
    
    # GEE getDownloadURL usually returns individual band tifs or a single multiband tif inside a zip file
    namelist = z.namelist()
    print(f"Files inside downloaded zip: {namelist}")
    
    os.makedirs("outputs", exist_ok=True)
    temp_extract_dir = os.path.join("outputs", f"temp_{output_name}")
    os.makedirs(temp_extract_dir, exist_ok=True)
    z.extractall(temp_extract_dir)

    # Let's import rasterio to merge the separate band tifs if GEE exported them separately
    import rasterio
    
    # Check if we have individual band files (e.g. *.B2.tif, *.B3.tif...) or a single multi-band file
    band_files = {band: None for band in ['B2', 'B3', 'B4', 'B8']}
    single_tif = None
    
    for filename in os.listdir(temp_extract_dir):
        if filename.endswith(".tif"):
            for band in band_files.keys():
                # Filename can be like "id.B2.tif" or "B2.tif"
                if f".{band}." in filename or filename.endswith(f"{band}.tif"):
                    band_files[band] = os.path.join(temp_extract_dir, filename)
            # If it's a single multi-band tif
            if len(namelist) == 1 or filename.endswith("download.tif"):
                single_tif = os.path.join(temp_extract_dir, filename)

    final_tif_path = os.path.join("outputs", f"{output_name}.tif")

    if single_tif and not any(band_files.values()):
        # It downloaded as a single multi-band file
        shutil_move(single_tif, final_tif_path)
        print(f"Saved multi-band TIFF directly to: {final_tif_path}")
    else:
        # It downloaded as separate band files, merge them into a single 4-band GeoTIFF
        # Order of bands: B2 (Blue), B3 (Green), B4 (Red), B8 (NIR)
        missing_bands = [b for b, path in band_files.items() if path is None]
        if missing_bands:
            raise RuntimeError(f"Missing band files in zip: {missing_bands}")
            
        print("Merging separate band GeoTIFFs into a single 4-band TIFF...")
        # Read metadata from B2
        with rasterio.open(band_files['B2']) as src:
            meta = src.meta.copy()
            
        # Update metadata to 4 bands
        meta.update(count=4)
        
        with rasterio.open(final_tif_path, 'w', **meta) as dst:
            # Band 1: Blue (B2), Band 2: Green (B3), Band 3: Red (B4), Band 4: NIR (B8)
            for idx, band in enumerate(['B2', 'B3', 'B4', 'B8'], 1):
                with rasterio.open(band_files[band]) as src:
                    dst.write(src.read(1), idx)
                    
        print(f"Successfully merged bands and saved GeoTIFF to: {final_tif_path}")
        
    # Clean up temp folder
    for f in os.listdir(temp_extract_dir):
        os.remove(os.path.join(temp_extract_dir, f))
    os.rmdir(temp_extract_dir)

def shutil_move(src, dst):
    import shutil
    shutil.move(src, dst)

def main():
    config = load_config()
    if not init_gee():
        return
        
    geometry = get_roi_geometry(config)
    
    # 1. Download BEFORE Image
    before_start = config['dates']['before']['start']
    before_end = config['dates']['before']['end']
    print("\n--- Downloading BEFORE Image ---")
    download_gee_image(geometry, before_start, before_end, config, "before")

    # 2. Download AFTER Image
    after_start = config['dates']['after']['start']
    after_end = config['dates']['after']['end']
    print("\n--- Downloading AFTER Image ---")
    download_gee_image(geometry, after_start, after_end, config, "after")
    
    print("\n[SUCCESS] Both satellite images downloaded successfully!")

if __name__ == "__main__":
    main()
