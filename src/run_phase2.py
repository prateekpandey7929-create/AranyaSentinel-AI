import os
import sys
import yaml
import traceback

# Import our custom modules
from gee_download import load_config, init_gee, get_roi_geometry, download_gee_image
from raster_utils import load_geotiff, convert_to_8bit_rgb, save_rgb_image, save_single_band_geotiff
from ndvi import calculate_ndvi, calculate_ndvi_difference
from inference import run_unet_inference, run_yolov8_inference
from severity import calculate_change_metrics, save_metrics_outputs
from visualization import generate_change_mask, generate_heatmap, generate_combined_dashboard

def main():
    print("==================================================")
    print("STARTING PHASE 2 - SATELLITE IMAGE PROCESSING & AI INFERENCE")
    print("==================================================")

    # 1. Load configuration
    try:
        config = load_config()
        print("Loaded configuration from config/settings.yaml successfully.")
    except Exception as e:
        print(f"[ERROR] Failed to load configuration: {e}")
        sys.exit(1)

    # 2. Download Satellite Images from Google Earth Engine
    # Check if we already have the raw GeoTIFF images to save download time/bandwidth if they exist.
    # But download is the default behavior if they don't exist.
    before_tif = "outputs/before.tif"
    after_tif = "outputs/after.tif"
    
    if not os.path.exists(before_tif) or not os.path.exists(after_tif):
        print("\n[STEP 1] Downloading raw Sentinel-2 images from GEE...")
        if init_gee():
            geometry = get_roi_geometry(config)
            
            # Download before
            before_start = config['dates']['before']['start']
            before_end = config['dates']['before']['end']
            try:
                download_gee_image(geometry, before_start, before_end, config, "before")
            except Exception as e:
                print(f"[ERROR] Failed to download 'before' image: {e}")
                sys.exit(1)
                
            # Download after
            after_start = config['dates']['after']['start']
            after_end = config['dates']['after']['end']
            try:
                download_gee_image(geometry, after_start, after_end, config, "after")
            except Exception as e:
                print(f"[ERROR] Failed to download 'after' image: {e}")
                sys.exit(1)
        else:
            print("[ERROR] GEE is not initialized/authenticated. Cannot download images.")
            sys.exit(1)
    else:
        print("\n[STEP 1] Raw Sentinel-2 images found locally in outputs/. Skipping GEE download.")

    # 3. Preprocess and load GeoTIFFs (Resize to 256x256)
    print("\n[STEP 2] Preprocessing GeoTIFFs (Alignment, Resizing and Normalization)...")
    try:
        before_bands, before_profile = load_geotiff(before_tif, target_size=(256, 256))
        after_bands, after_profile = load_geotiff(after_tif, target_size=(256, 256))
        print("Loaded and resized Sentinel-2 bands to 256x256 successfully.")
        
        # Convert to 8-bit RGB
        before_rgb = convert_to_8bit_rgb(before_bands)
        after_rgb = convert_to_8bit_rgb(after_bands)
        
        # Save RGB images
        save_rgb_image(before_rgb, "outputs/before_rgb.png")
        save_rgb_image(after_rgb, "outputs/after_rgb.png")
    except Exception as e:
        print(f"[ERROR] Preprocessing failed: {e}")
        traceback.print_exc()
        sys.exit(1)

    # 4. Calculate NDVI
    print("\n[STEP 3] Calculating NDVI maps...")
    try:
        ndvi_before = calculate_ndvi(before_bands)
        ndvi_after = calculate_ndvi(after_bands)
        ndvi_diff = calculate_ndvi_difference(ndvi_before, ndvi_after)
        
        # Save NDVI GeoTIFF outputs
        save_single_band_geotiff(ndvi_before, before_profile, "outputs/ndvi_before.tif")
        save_single_band_geotiff(ndvi_after, after_profile, "outputs/ndvi_after.tif")
        save_single_band_geotiff(ndvi_diff, after_profile, "outputs/ndvi_difference.tif")
    except Exception as e:
        print(f"[ERROR] NDVI calculation failed: {e}")
        traceback.print_exc()
        sys.exit(1)

    # 5. AI Inference
    print("\n[STEP 4] Running U-Net and YOLOv8 Inference...")
    try:
        # Run U-Net for Forest Loss Segmentation
        unet_thresh = config['thresholds']['unet_threshold']
        morphology_kernel_size = config.get('thresholds', {}).get('morphology_kernel_size', 3)
        unet_prob, unet_mask = run_unet_inference(
            after_rgb, 
            weights_path="weights/unet_forest_loss.pth", 
            threshold=unet_thresh,
            morphology_kernel_size=morphology_kernel_size
        )
        
        # Run YOLOv8 for Building/Encroachment Detection
        yolo_conf = config['thresholds']['yolo_conf']
        yolo_detections = run_yolov8_inference(
            after_rgb, 
            weights_path="weights/yolov8_encroachment.pt", 
            conf_threshold=yolo_conf
        )
    except Exception as e:
        print(f"[ERROR] AI Inference failed: {e}")
        traceback.print_exc()
        sys.exit(1)

    # 6. Combine Outputs & Calculate Severity
    print("\n[STEP 5] Combining NDVI, U-Net, and YOLOv8 outputs...")
    try:
        change_mask, metrics, encroachments = calculate_change_metrics(
            ndvi_before, 
            ndvi_diff, 
            unet_mask, 
            unet_prob,
            yolo_detections, 
            config
        )
        
        # Save JSON and Text report
        save_metrics_outputs(
            metrics, 
            "outputs/severity.json", 
            "outputs/summary.txt", 
            config
        )
    except Exception as e:
        print(f"[ERROR] Metric calculation failed: {e}")
        traceback.print_exc()
        sys.exit(1)

    # 7. Generate Visualizations
    print("\n[STEP 6] Generating heatmaps and combined visual dashboard...")
    try:
        # Binary change mask
        generate_change_mask(change_mask, "outputs/change_mask.png")
        
        # Deforestation Heatmap overlay
        heatmap_overlay = generate_heatmap(after_rgb, change_mask, "outputs/heatmap.png")
        
        # Combined 2x2 dashboard
        generate_combined_dashboard(
            before_rgb, 
            after_rgb, 
            ndvi_diff, 
            heatmap_overlay, 
            encroachments, 
            "outputs/combined_result.png"
        )
        print("Visualization generation complete.")
    except Exception as e:
        print(f"[ERROR] Visualization failed: {e}")
        traceback.print_exc()
        sys.exit(1)

    print("\n==================================================")
    print("PHASE 2 SUCCESS: ALL OUTPUTS GENERATED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    main()
