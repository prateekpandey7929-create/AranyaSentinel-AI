import os
import sys
import time
import logging
import numpy as np
from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import PlainTextResponse
from typing import Dict, Any

# Resolve absolute path to project root
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(BASE_DIR, 'src'))

# Import schemas
from schemas.request import AnalyzeRequest
from schemas.response import AnalyzeResponse, OutputFiles, ConfigResponse

# Import services
from services.gee_service import download_satellite_images
from services.inference_service import run_unet_inference_loaded, run_yolov8_inference_loaded
from services.report_service import load_settings, save_settings, get_summary_text, get_severity_json

# Import existing verified ML/raster logic
from raster_utils import load_geotiff, convert_to_8bit_rgb, save_rgb_image, save_single_band_geotiff
from ndvi import calculate_ndvi, calculate_ndvi_difference
from severity import calculate_change_metrics, save_metrics_outputs
from visualization import generate_change_mask, generate_heatmap, generate_combined_dashboard

# Import Forest Health modules
from forest_health.schemas.health_schema import ForestHealthResponse
from forest_health.services.health_engine import run_forest_health_analysis

# Import Cloud Removal modules
from cloud_removal.cloud_service import process_monsoon_image

# Import Season Verification modules
from season_verification.decision_engine import verify_season_impact
from season_verification.schemas import SeasonVerificationRequest, SeasonVerificationResponse

# Import Forest Knowledge Explorer modules
from forest_knowledge.resolver import resolve_forest_knowledge
from forest_knowledge.schemas import ForestKnowledgeRequest, ForestKnowledgeResponse

# Import AI Prediction modules
from ai_prediction import compute_ai_prediction, AIPredictionRequest, AIPredictionResponse

router = APIRouter()
logger = logging.getLogger("backend")

# Resolve folders
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')
WEIGHTS_DIR = os.path.join(BASE_DIR, 'weights')

@router.get("/", status_code=status.HTTP_200_OK)
async def health_check():
    """
    Exposes API health status.
    """
    logger.info("Health check endpoint hit.")
    return {
        "status": "running",
        "service": "AI Forest Loss Monitoring"
    }

@router.post("/analyze", response_model=AnalyzeResponse, status_code=status.HTTP_200_OK)
async def analyze_forest_loss(request: AnalyzeRequest, req: Request):
    """
    Main Analysis API. Downloads Sentinel-2 images, calculates NDVI,
    runs U-Net and YOLOv8 inference, and generates visualizations.
    Tracks and logs precise execution times for each phase.
    """
    start_time = time.time()
    
    # 1. Load current configuration settings
    try:
        config = load_settings()
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Configuration error: {e}"
        )
    
    # 2. Overwrite in-memory config based on custom ROI to reflect in reports
    if request.roi_latlon:
        config['roi']['lat'] = request.roi_latlon.lat
        config['roi']['lon'] = request.roi_latlon.lon
        config['roi']['buffer_degree'] = request.roi_latlon.buffer_degree
        config['roi']['name'] = "Custom Coordinate Bounds"
    elif request.roi_geojson:
        # Resolve centroid of GeoJSON geometry to represent center in reports
        try:
            geom = request.roi_geojson
            if request.roi_geojson.get("type") == "FeatureCollection":
                geom = request.roi_geojson.get("features", [])[0].get("geometry", {})
            elif request.roi_geojson.get("type") == "Feature":
                geom = request.roi_geojson.get("geometry", {})
                
            if geom.get("type") == "Polygon":
                coords = geom.get("coordinates", [[]])[0]
                if coords:
                    lons = [c[0] for c in coords]
                    lats = [c[1] for c in coords]
                    avg_lat = sum(lats) / len(lats)
                    avg_lon = sum(lons) / len(lons)
                    config['roi']['lat'] = round(avg_lat, 6)
                    config['roi']['lon'] = round(avg_lon, 6)
                    config['roi']['name'] = "Custom Map Selection Polygon"
        except Exception as e:
            logger.warning(f"Could not compute GeoJSON centroid for report metadata: {e}")

    # 3. Resolve ROI descriptor for detailed logging
    if request.roi_geojson:
        roi_desc = f"GeoJSON Polygon (Type: {request.roi_geojson.get('type')})"
    elif request.roi_latlon:
        roi_desc = f"Coordinates (Center: Lat {request.roi_latlon.lat}, Lon {request.roi_latlon.lon}, Buffer: {request.roi_latlon.buffer_degree})"
    else:
        roi_desc = f"Default Bounding Box (Center: Lat {config['roi']['lat']}, Lon {config['roi']['lon']})"

    logger.info(f"==================================================")
    logger.info(f"API EXECUTION: POST /analyze request received")
    logger.info(f"ROI Parameters: {roi_desc}")
    logger.info(f"Before Date Range: {request.before_dates.start} to {request.before_dates.end}")
    logger.info(f"After Date Range: {request.after_dates.start} to {request.after_dates.end}")
    logger.info(f"==================================================")

    # 3. Setup GEE download
    before_tif = os.path.join(OUTPUTS_DIR, "before.tif")
    after_tif = os.path.join(OUTPUTS_DIR, "after.tif")
    
    # We clear older outputs to force GEE download of the specified dates/ROI
    for path in [before_tif, after_tif]:
        if os.path.exists(path):
            os.remove(path)

    # Measure GEE download duration
    download_start_time = time.time()
    try:
        download_satellite_images(
            roi_geojson=request.roi_geojson,
            roi_latlon=request.roi_latlon,
            before_dates=request.before_dates,
            after_dates=request.after_dates,
            config=config
        )
        download_duration = time.time() - download_start_time
        logger.info(f"GEE Download status: SUCCESS (Time taken: {download_duration:.2f} seconds)")
    except RuntimeError as e:
        logger.error(f"GEE Download status: FAILED (Error: {e})")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Google Earth Engine Download Error: {e}"
        )
    except Exception as e:
        logger.error(f"GEE Download status: FAILED (Unexpected Error: {e})")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Earth Engine query failed: {e}"
        )

    # 4. Preprocessing (Resize and convert to 8-bit RGB)
    logger.info("Running preprocessing on downloaded GeoTIFFs...")
    try:
        before_bands, before_profile = load_geotiff(before_tif, target_size=(256, 256))
        after_bands, after_profile = load_geotiff(after_tif, target_size=(256, 256))
        
        # 3.5. Run Cloud Detection & Apply Hybrid Monsoon Cloud Filter
        logger.info("Running Monsoon Cloud Filter...")
        from cloud_removal.cloud_detector import detect_clouds
        
        # Detect clouds
        before_initial_mask = detect_clouds(before_bands)
        after_initial_mask = detect_clouds(after_bands)
        
        before_cloud_pct = float((np.sum(before_initial_mask == 255) / before_initial_mask.size) * 100.0)
        after_cloud_pct = float((np.sum(after_initial_mask == 255) / after_initial_mask.size) * 100.0)
        
        logger.info(f"Detected Cloud Coverage - Before: {before_cloud_pct:.2f}%, After: {after_cloud_pct:.2f}%")
        
        # Hard Filter Rule: Block if cloud cover > 40%
        if after_cloud_pct > 40.0:
            logger.warning(f"Analysis blocked: Cloud cover on after image is {after_cloud_pct:.2f}% (exceeds 40% threshold)")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Severe Cloud Cover detected ({after_cloud_pct:.2f}%). Analysis blocked. Please select a different date range or region with less cloud cover."
            )
            
        # Warning generation for moderate cloud cover (15% - 40%)
        cloud_warning = None
        if after_cloud_pct >= 15.0:
            cloud_warning = f"Moderate Cloud Cover detected ({after_cloud_pct:.2f}%). Gap-filling and enhancement applied, but some AI predictions may be simulated or less reliable."
            logger.warning(cloud_warning)

        # Proceed with Gap Filling and Enhancement for both images
        try:
            # Process 'before' bands
            before_bands, before_mask, _, _, _, _ = process_monsoon_image(
                before_bands, historical_bands=None
            )
            # Process 'after' bands using 'before' bands as historical reference
            after_bands, after_mask, _, _, _, _ = process_monsoon_image(
                after_bands, historical_bands=before_bands
            )
            
            # Save cloud mask images for visualization
            import cv2
            cv2.imwrite(os.path.join(OUTPUTS_DIR, "before_cloud_mask.png"), before_mask)
            cv2.imwrite(os.path.join(OUTPUTS_DIR, "after_cloud_mask.png"), after_mask)
            logger.info("Cloud removal and image enhancement finished successfully.")
        except Exception as e:
            logger.error(f"Error during cloud removal pipeline execution: {e}. Proceeding with raw imagery.")

        before_rgb = convert_to_8bit_rgb(before_bands)
        after_rgb = convert_to_8bit_rgb(after_bands)
        
        save_rgb_image(before_rgb, os.path.join(OUTPUTS_DIR, "before_rgb.png"))
        save_rgb_image(after_rgb, os.path.join(OUTPUTS_DIR, "after_rgb.png"))
    except Exception as e:
        logger.error(f"Preprocessing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Preprocessing failed: {e}"
        )

    # 5. NDVI Calculations
    logger.info("Calculating NDVI maps...")
    try:
        ndvi_before = calculate_ndvi(before_bands)
        ndvi_after = calculate_ndvi(after_bands)
        ndvi_diff = calculate_ndvi_difference(ndvi_before, ndvi_after)
        
        save_single_band_geotiff(ndvi_before, before_profile, os.path.join(OUTPUTS_DIR, "ndvi_before.tif"))
        save_single_band_geotiff(ndvi_after, after_profile, os.path.join(OUTPUTS_DIR, "ndvi_after.tif"))
        save_single_band_geotiff(ndvi_diff, after_profile, os.path.join(OUTPUTS_DIR, "ndvi_difference.tif"))
    except Exception as e:
        logger.error(f"NDVI processing failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"NDVI calculations failed: {e}"
        )

    # 6. AI Inference using memory pre-loaded models (Measure execution time)
    logger.info("Running AI Model Inference...")
    inference_start_time = time.time()
    try:
        unet_thresh = config['thresholds']['unet_threshold']
        morphology_kernel_size = config['thresholds']['morphology_kernel_size']
        
        # Load U-Net and YOLOv8 models from app.state
        unet_model = req.app.state.unet
        yolo_model = req.app.state.yolo
        device = req.app.state.device
        
        # Run segmentation on pre-loaded U-Net
        unet_prob, unet_mask = run_unet_inference_loaded(
            unet_model=unet_model,
            rgb_image=after_rgb,
            device=device,
            threshold=unet_thresh,
            morphology_kernel_size=morphology_kernel_size
        )
        
        # Run detection on pre-loaded YOLOv8
        yolo_conf = config['thresholds']['yolo_conf']
        yolo_detections = run_yolov8_inference_loaded(
            yolo_model=yolo_model,
            rgb_image=after_rgb,
            device=device,
            conf_threshold=yolo_conf
        )
        inference_duration = time.time() - inference_start_time
        logger.info(f"AI Inference execution time: {inference_duration:.2f} seconds (U-Net + YOLOv8)")
    except AttributeError as e:
        logger.critical(f"Models not loaded in app state: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model weights not pre-loaded on server. Server initializing error."
        )
    except Exception as e:
        logger.error(f"AI Inference failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI model inference failed: {e}"
        )

    # 7. Combined Outputs & Severity Calculations
    logger.info("Combining NDVI and AI results to compute metrics...")
    try:
        change_mask, metrics, encroachments = calculate_change_metrics(
            ndvi_before=ndvi_before,
            ndvi_diff=ndvi_diff,
            unet_mask=unet_mask,
            unet_prob=unet_prob,
            yolo_detections=yolo_detections,
            config=config
        )
    except Exception as e:
        logger.error(f"Metrics calculations failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Combined analysis failed: {e}"
        )

    # 7.5. Run Season-Aware Verification & Forest Knowledge Explorer
    logger.info("Executing Season-Aware Verification & Forest Knowledge Explorer...")
    season_detail = None
    knowledge_detail = None
    prediction_detail = None
    try:
        # Resolve centroid lat, lon
        lat_val = config['roi']['lat']
        lon_val = config['roi']['lon']
        if request.roi_latlon:
            lat_val = request.roi_latlon.lat
            lon_val = request.roi_latlon.lon
        elif request.roi_geojson:
            try:
                geom = request.roi_geojson
                if geom.get("type") == "FeatureCollection" and geom.get("features"):
                    geom = geom["features"][0].get("geometry", {})
                elif geom.get("type") == "Feature" and geom.get("geometry"):
                    geom = geom["geometry"]
                
                if geom.get("type") == "Polygon" and geom.get("coordinates"):
                    coords = geom["coordinates"][0]
                    lat_val = sum(c[1] for c in coords) / len(coords)
                    lon_val = sum(c[0] for c in coords) / len(coords)
            except Exception as e:
                logger.warning(f"Failed to calculate centroid from GeoJSON: {e}. Using default ROI coordinates.")

        # Resolve month
        analysis_month = 3
        try:
            from datetime import datetime
            dt = datetime.strptime(request.after_dates.start, "%Y-%m-%d")
            analysis_month = dt.month
        except Exception as e:
            logger.warning(f"Could not parse after_dates.start: {e}. Using default month 3 (March).")

        # Resolve current NDVI average
        current_ndvi_val = float(np.nanmean(ndvi_after))

        # Run verification engine
        verif_res = verify_season_impact(
            lat=lat_val,
            lon=lon_val,
            month=analysis_month,
            forest_loss_pct=metrics['forest_loss_percentage'],
            encroachments=metrics['encroachment_count'],
            current_ndvi=current_ndvi_val
        )

        # Modify severity score if it's natural seasonal change
        if verif_res["classification"] == "Natural Seasonal Change":
            metrics['severity_score'] = "Low"

        # Build Response Detail schema
        from schemas.response import SeasonVerificationDetail
        season_detail = SeasonVerificationDetail(
            classification=verif_res["classification"],
            confidence_score=verif_res["confidence"],
            explanation=verif_res["explanation"],
            weather_summary=f"Season: {verif_res['weather']['season']}, Temp: {verif_res['weather']['temp']}°C, Rainfall: {verif_res['weather']['rainfall']}mm",
            historical_ndvi_average=verif_res["ndvi_comparison"]["historical_average"]
        )

        # Run Forest Knowledge Explorer
        try:
            from schemas.response import ForestKnowledgeDetail
            knowledge_res = resolve_forest_knowledge(lat=lat_val, lon=lon_val)
            knowledge_detail = ForestKnowledgeDetail(
                name=knowledge_res["name"],
                forest_type=knowledge_res["forest_type"],
                protected_status=knowledge_res["protected_status"],
                district=knowledge_res["district"],
                state=knowledge_res["state"],
                country=knowledge_res["country"],
                geographical_location=knowledge_res["geographical_location"],
                climate=knowledge_res["climate"],
                annual_rainfall=knowledge_res["annual_rainfall"],
                major_vegetation=knowledge_res["major_vegetation"],
                dominant_tree_species=knowledge_res["dominant_tree_species"],
                biodiversity=knowledge_res["biodiversity"],
                important_flora_and_fauna=knowledge_res["important_flora_and_fauna"],
                ecological_importance=knowledge_res["ecological_importance"],
                nearby_water_bodies=knowledge_res["nearby_water_bodies"],
                why_famous=knowledge_res["why_famous"]
            )
        except Exception as e:
            logger.error(f"Forest Knowledge lookup failed: {e}. Continuing.")

    except Exception as e:
        logger.error(f"Season verification failed: {e}. Continuing without verification.")

    # 8. Generate Visualizations
    logger.info("Generating heatmap and visual dashboard overlays...")
    try:
        generate_change_mask(change_mask, os.path.join(OUTPUTS_DIR, "change_mask.png"))
        
        heatmap_overlay = generate_heatmap(after_rgb, change_mask, os.path.join(OUTPUTS_DIR, "heatmap.png"))
        
        generate_combined_dashboard(
            before_rgb=before_rgb,
            after_rgb=after_rgb,
            ndvi_diff=ndvi_diff,
            heatmap_overlay=heatmap_overlay,
            encroachments=encroachments,
            out_path=os.path.join(OUTPUTS_DIR, "combined_result.png")
        )
    except Exception as e:
        logger.error(f"Visualization overlay failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Visualization dashboard failed: {e}"
        )

    # Calculate overall durations
    total_duration = time.time() - start_time
    output_duration = total_duration - download_duration - inference_duration
    logger.info(f"Visual outputs and report generated in {output_duration:.2f} seconds.")
    logger.info(f"API /analyze run completed in {total_duration:.2f} seconds.")

    # Save detailed timings to metrics dict for report display
    metrics['execution_times'] = {
        'gee_download_seconds': round(download_duration, 2),
        'ai_inference_seconds': round(inference_duration, 2),
        'output_generation_seconds': round(output_duration, 2),
        'total_execution_seconds': round(total_duration, 2)
    }

    # Save summary report and JSON file with timing info
    try:
        save_metrics_outputs(
            metrics=metrics,
            out_json_path=os.path.join(OUTPUTS_DIR, "severity.json"),
            out_txt_path=os.path.join(OUTPUTS_DIR, "summary.txt"),
            config=config
        )
    except Exception as e:
        logger.error(f"Saving final report outputs failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Saving report outputs failed: {e}"
        )

    # 7.7. Run AI Prediction Engine
    logger.info("Executing AI Prediction Engine after report outputs are written...")
    try:
        from forest_health.services.health_engine import run_forest_health_analysis
        from schemas.response import AIPredictionDetail
        
        # Fetch current health score (loads the freshly saved outputs correctly!)
        health_data = run_forest_health_analysis()
        health_val = health_data.overall_score
        
        # Get season classification string
        season_class = season_detail.classification if season_detail else None
        
        # Run prediction logic
        pred_res = compute_ai_prediction(
            forest_loss_pct=metrics['forest_loss_percentage'],
            encroachments=metrics['encroachment_count'],
            health_score=health_val,
            season_classification=season_class,
            cloud_pct=after_cloud_pct
        )
        
        # Build Response schema
        prediction_detail = AIPredictionDetail(
            prediction=pred_res["prediction"],
            reason=pred_res["reason"],
            severity=pred_res["severity"],
            confidence_score=pred_res["confidence_score"],
            suggested_actions=pred_res["suggested_actions"],
            ai_summary=pred_res["ai_summary"],
            trend_direction=pred_res["trend_direction"],
            future_prediction=pred_res["future_prediction"],
            recovery_probability=pred_res["recovery_probability"],
            trend_summary=pred_res["trend_summary"]
        )
    except Exception as e:
        logger.error(f"AI Prediction Engine failed: {e}. Continuing.")

    # Construct and return response
    return AnalyzeResponse(
        forest_loss_percentage=metrics['forest_loss_percentage'],
        changed_area_hectares=metrics['changed_area_hectares'],
        severity_score=metrics['severity_score'],
        encroachment_count=metrics['encroachment_count'],
        average_unet_confidence=metrics['average_unet_confidence'],
        average_yolo_confidence=metrics['average_yolo_confidence'],
        cloud_coverage_percentage=round(after_cloud_pct, 2),
        cloud_warning=cloud_warning,
        season_verification=season_detail,
        forest_knowledge=knowledge_detail,
        ai_prediction=prediction_detail,
        output_files=OutputFiles(
            before_rgb="/static/before_rgb.png",
            after_rgb="/static/after_rgb.png",
            heatmap="/static/heatmap.png",
            change_mask="/static/change_mask.png",
            combined_result="/static/combined_result.png"
        )
    )

@router.get("/outputs", status_code=status.HTTP_200_OK)
async def list_outputs():
    """
    Returns relative web URLs of all generated outputs.
    """
    logger.info("Listing output file URLs.")
    output_files = [
        "before.tif", "after.tif",
        "before_rgb.png", "after_rgb.png",
        "ndvi_before.tif", "ndvi_after.tif", "ndvi_difference.tif",
        "change_mask.png", "heatmap.png", "combined_result.png",
        "summary.txt", "severity.json"
    ]
    
    urls = {}
    for f in output_files:
        path = os.path.join(OUTPUTS_DIR, f)
        if os.path.exists(path):
            urls[f.split('.')[0]] = f"/static/{f}" if f.endswith(('.png', '.tif', '.txt', '.json')) else f
            
    return urls

@router.get("/summary", response_class=PlainTextResponse, status_code=status.HTTP_200_OK)
async def get_summary_report():
    """
    Returns summary.txt file content directly as plain text.
    """
    logger.info("Retrieving plain-text summary report.")
    try:
        return get_summary_text()
    except FileNotFoundError as e:
        logger.error(f"Summary not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Summary report not found. Run /analyze first to compile it."
        )

@router.get("/severity", status_code=status.HTTP_200_OK)
async def get_severity_metrics():
    """
    Returns severity.json metrics directly as JSON.
    """
    logger.info("Retrieving severity.json metrics.")
    try:
        return get_severity_json()
    except FileNotFoundError as e:
        logger.error(f"Severity metrics not found: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Severity metrics not found. Run /analyze first to compile it."
        )

@router.get("/config", response_model=ConfigResponse, status_code=status.HTTP_200_OK)
async def get_current_configuration():
    """
    Exposes current settings.yaml file configuration as JSON.
    """
    logger.info("Retrieving configuration settings.")
    try:
        return load_settings()
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Configuration read error: {e}"
        )

@router.post("/config", status_code=status.HTTP_200_OK)
async def update_configuration(new_config: Dict[str, Any]):
    """
    Updates settings.yaml configuration values dynamically.
    Does NOT require server reboot.
    """
    logger.info(f"Received configuration update: {new_config}")
    try:
        # Load existing config
        current_config = load_settings()
        
        # Merge dictionary keys recursively
        for section, values in new_config.items():
            if section in current_config:
                if isinstance(values, dict) and isinstance(current_config[section], dict):
                    # For nested dictionaries like 'thresholds' or 'roi'
                    for k, v in values.items():
                        if k == 'severity' and isinstance(v, dict):
                            current_config[section][k].update(v)
                        else:
                            current_config[section][k] = v
                else:
                    current_config[section] = values
                    
        # Save back to disk
        save_settings(current_config)
        logger.info("Configuration updated successfully.")
        return {"status": "success", "message": "Configuration updated dynamically."}
    except Exception as e:
        logger.error(f"Failed to save configuration update: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update configuration: {e}"
        )

@router.get("/forest-health", response_model=ForestHealthResponse, status_code=status.HTTP_200_OK)
async def get_forest_health():
    """
    Computes overall Forest Health Score and breakdown of metrics based on the latest generated outputs.
    """
    logger.info("API EXECUTION: GET /forest-health request received")
    try:
        health_data = run_forest_health_analysis()
        return health_data.to_dict()
    except Exception as e:
        logger.error(f"Forest Health Score compilation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Forest Health computation failed: {e}"
        )

@router.post("/cloud-removal", status_code=status.HTTP_200_OK)
async def run_cloud_removal(image_type: str = "after"):
    """
    Applies the cloud detection, masking, and enhancement pipeline to the selected image.
    """
    logger.info(f"API EXECUTION: POST /cloud-removal received for image_type={image_type}")
    
    if image_type not in ["before", "after"]:
        raise HTTPException(status_code=400, detail="Invalid image_type. Must be 'before' or 'after'")
        
    target_tif = os.path.join(OUTPUTS_DIR, f"{image_type}.tif")
    if not os.path.exists(target_tif):
        raise HTTPException(status_code=404, detail=f"Satellite image '{image_type}.tif' not found. Run /analyze first to download it.")
        
    try:
        # Load raw bands
        bands, profile = load_geotiff(target_tif, target_size=(256, 256))
        
        # Load historical if we are processing "after"
        historical_bands = None
        if image_type == "after":
            before_tif_path = os.path.join(OUTPUTS_DIR, "before.tif")
            if os.path.exists(before_tif_path):
                historical_bands, _ = load_geotiff(before_tif_path, target_size=(256, 256))
                
        # Process
        enhanced_bands, mask, initial_pct, final_pct, quality, duration = process_monsoon_image(
            bands, historical_bands
        )
        
        # Convert to RGB and save outputs for dashboard visualization
        enhanced_rgb = convert_to_8bit_rgb(enhanced_bands)
        original_rgb = convert_to_8bit_rgb(bands)
        
        import cv2
        cv2.imwrite(os.path.join(OUTPUTS_DIR, f"{image_type}_cloud_mask.png"), mask)
        cv2.imwrite(os.path.join(OUTPUTS_DIR, f"{image_type}_enhanced_rgb.png"), cv2.cvtColor(enhanced_rgb, cv2.COLOR_RGB2BGR))
        cv2.imwrite(os.path.join(OUTPUTS_DIR, f"{image_type}_original_rgb.png"), cv2.cvtColor(original_rgb, cv2.COLOR_RGB2BGR))
        
        # Calculate NDVI values
        orig_ndvi = calculate_ndvi(bands)
        enh_ndvi = calculate_ndvi(enhanced_bands)
        
        # Save NDVI maps as geotiffs
        save_single_band_geotiff(orig_ndvi, profile, os.path.join(OUTPUTS_DIR, f"{image_type}_orig_ndvi.tif"))
        save_single_band_geotiff(enh_ndvi, profile, os.path.join(OUTPUTS_DIR, f"{image_type}_enh_ndvi.tif"))
        
        # Generate warning if cloud coverage is too high
        warning = None
        if final_pct > 35.0:
            warning = f"High cloud cover warning: Remaining clouds ({final_pct:.1f}%) exceed threshold."
            
        return {
            "status": "success",
            "image_type": image_type,
            "initial_cloud_percentage": round(initial_pct, 2),
            "final_cloud_percentage": round(final_pct, 2),
            "image_quality_score": quality,
            "processing_time_seconds": round(duration, 4),
            "warning": warning,
            "urls": {
                "original_image": f"/static/{image_type}_original_rgb.png",
                "cloud_mask": f"/static/{image_type}_cloud_mask.png",
                "enhanced_image": f"/static/{image_type}_enhanced_rgb.png"
            }
        }
    except Exception as e:
        logger.error(f"Cloud removal API failed: {e}")
        raise HTTPException(status_code=500, detail=f"Cloud removal processing failed: {e}")

@router.post("/season-verification", response_model=SeasonVerificationResponse, status_code=status.HTTP_200_OK)
async def run_season_verification(request: SeasonVerificationRequest):
    """
    Direct endpoint to verify a detected forest change against historical weather and NDVI baselines.
    """
    logger.info("API EXECUTION: POST /season-verification request received")
    try:
        res = verify_season_impact(
            lat=request.latitude,
            lon=request.longitude,
            month=request.month,
            forest_loss_pct=request.forest_loss_percentage,
            encroachments=request.encroachment_count,
            current_ndvi=request.current_ndvi
        )
        return SeasonVerificationResponse(
            status="success",
            classification=res["classification"],
            confidence_score=res["confidence"],
            explanation=res["explanation"],
            weather={
                "season": res["weather"]["season"],
                "temp": res["weather"]["temp"],
                "rainfall": res["weather"]["rainfall"]
            },
            ndvi_comparison={
                "current": res["ndvi_comparison"]["current"],
                "historical_average": res["ndvi_comparison"]["historical_average"],
                "historical_min": res["ndvi_comparison"]["historical_min"],
                "historical_max": res["ndvi_comparison"]["historical_max"]
            }
        )
    except Exception as e:
        logger.error(f"Season verification API failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {e}"
        )

@router.post("/forest-knowledge", response_model=ForestKnowledgeResponse, status_code=status.HTTP_200_OK)
async def get_forest_knowledge_info(request: ForestKnowledgeRequest):
    """
    Retrieves rich ecological and encyclopedic information for the given coordinates.
    """
    logger.info("API EXECUTION: POST /forest-knowledge request received")
    try:
        res = resolve_forest_knowledge(lat=request.latitude, lon=request.longitude)
        return ForestKnowledgeResponse(
            status="success",
            name=res["name"],
            forest_type=res["forest_type"],
            protected_status=res["protected_status"],
            district=res["district"],
            state=res["state"],
            country=res["country"],
            geographical_location=res["geographical_location"],
            climate=res["climate"],
            annual_rainfall=res["annual_rainfall"],
            major_vegetation=res["major_vegetation"],
            dominant_tree_species=res["dominant_tree_species"],
            biodiversity=res["biodiversity"],
            important_flora_and_fauna=res["important_flora_and_fauna"],
            ecological_importance=res["ecological_importance"],
            nearby_water_bodies=res["nearby_water_bodies"],
            why_famous=res["why_famous"]
        )
    except Exception as e:
        logger.error(f"Forest knowledge API failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve forest knowledge: {e}"
        )

@router.post("/ai-prediction", response_model=AIPredictionResponse, status_code=status.HTTP_200_OK)
async def get_ai_prediction_insights(request: AIPredictionRequest):
    """
    Executes rules-based prediction reasoning engine on the provided metrics.
    """
    logger.info("API EXECUTION: POST /ai-prediction request received")
    try:
        res = compute_ai_prediction(
            forest_loss_pct=request.forest_loss_percentage,
            encroachments=request.encroachment_count,
            health_score=request.health_score,
            season_classification=request.season_classification,
            cloud_pct=request.cloud_coverage_percentage
        )
        return AIPredictionResponse(
            status="success",
            prediction=res["prediction"],
            reason=res["reason"],
            severity=res["severity"],
            confidence_score=res["confidence_score"],
            suggested_actions=res["suggested_actions"],
            ai_summary=res["ai_summary"],
            trend_direction=res["trend_direction"],
            future_prediction=res["future_prediction"],
            recovery_probability=res["recovery_probability"],
            trend_summary=res["trend_summary"]
        )
    except Exception as e:
        logger.error(f"AI prediction API failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {e}"
        )


