import json
import numpy as np

def calculate_change_metrics(ndvi_before, ndvi_diff, unet_mask, unet_prob, yolo_detections, config):
    """
    Combines NDVI, U-Net, and YOLO results to compute forest loss percentage,
    changed area (in hectares), encroachment count, and severity classification.
    Includes average confidence scores for models.
    """
    ndvi_loss_threshold = config['thresholds']['ndvi_loss_threshold']
    
    # Final Change Mask logic:
    # 1. Pixel must have been vegetated initially (NDVI Before > 0.2)
    # 2. Pixel must show loss either via U-Net (unet_mask == 255) OR NDVI difference > threshold
    initial_vegetation = ndvi_before > 0.2
    loss_detected = (unet_mask == 255) | (ndvi_diff > ndvi_loss_threshold)
    
    change_mask = initial_vegetation & loss_detected
    
    # Calculate forest loss percentage
    total_pixels = change_mask.size
    loss_pixels = int(np.sum(change_mask))
    forest_loss_pct = (loss_pixels / total_pixels) * 100.0
    
    # Calculate area in Hectares
    # Sentinel-2 resolution: 10m x 10m = 100 sq meters per pixel
    # 1 Hectare = 10,000 sq meters
    pixel_area_ha = 0.01  # (10 * 10) / 10000.0
    changed_area_ha = loss_pixels * pixel_area_ha
    
    # Calculate encroachments (YOLO detections inside deforestation areas)
    encroachment_count = 0
    encroachments = []
    
    height, width = change_mask.shape
    for det in yolo_detections:
        x1, y1, x2, y2 = det['box']
        
        # Calculate center point of building box
        cx = int((x1 + x2) // 2)
        cy = int((y1 + y2) // 2)
        
        # Clip coordinates to image boundary
        cx = min(max(cx, 0), width - 1)
        cy = min(max(cy, 0), height - 1)
        
        # If building is located on a deforested pixel, flag it as encroachment
        is_encroachment = False
        # Check center first
        if change_mask[cy, cx]:
            is_encroachment = True
        else:
            # Check if any part of the bounding box falls on deforested area
            box_area = change_mask[y1:y2, x1:x2]
            if box_area.size > 0 and np.any(box_area):
                is_encroachment = True
                
        if is_encroachment:
            encroachment_count += 1
            encroachments.append(det)

    # Calculate severity based on configured thresholds
    low_thresh = config['thresholds']['severity']['low']
    med_thresh = config['thresholds']['severity']['medium']
    
    if forest_loss_pct < low_thresh:
        severity = "Low"
    elif forest_loss_pct < med_thresh:
        severity = "Medium"
    else:
        severity = "High"

    # Calculate average U-Net confidence over change area
    if np.any(change_mask):
        avg_unet_conf = float(np.mean(unet_prob[change_mask]))
    else:
        avg_unet_conf = 0.0

    # Calculate average YOLO confidence
    yolo_confs = [det['conf'] for det in yolo_detections]
    avg_yolo_conf = float(np.mean(yolo_confs)) if yolo_confs else 0.0

    metrics = {
        'forest_loss_percentage': round(forest_loss_pct, 2),
        'changed_area_hectares': round(changed_area_ha, 2),
        'total_buildings_detected': len(yolo_detections),
        'encroachment_count': encroachment_count,
        'severity_score': severity,
        'average_unet_confidence': round(avg_unet_conf, 4),
        'average_yolo_confidence': round(avg_yolo_conf, 4)
    }
    
    return change_mask, metrics, encroachments

def save_metrics_outputs(metrics, out_json_path, out_txt_path, config):
    """
    Saves metrics to outputs/severity.json and outputs/summary.txt.
    """
    # 1. Save JSON
    with open(out_json_path, 'w') as f:
        json.dump(metrics, f, indent=4)
    print(f"Saved severity metrics to: {out_json_path}")
    
    # Format optional processing performance metrics
    exec_text = ""
    if 'execution_times' in metrics:
        exec_text = f"""
--------------------------------------------------
PROCESSING PERFORMANCE:
--------------------------------------------------
- GEE Download Time:        {metrics['execution_times']['gee_download_seconds']:.2f} seconds
- AI Inference Time:        {metrics['execution_times']['ai_inference_seconds']:.2f} seconds
- Visual Output Gen Time:   {metrics['execution_times']['output_generation_seconds']:.2f} seconds
- Total Run Duration:       {metrics['execution_times']['total_execution_seconds']:.2f} seconds
"""

    # 2. Save Text Summary
    summary_text = f"""==================================================
AI FOREST LOSS MONITORING SYSTEM - SUMMARY REPORT
==================================================
Region of Interest: {config['roi']['name']}
Latitude: {config['roi']['lat']} | Longitude: {config['roi']['lon']}

Date Range:
- Before: {config['dates']['before']['start']} to {config['dates']['before']['end']}
- After:  {config['dates']['after']['start']} to {config['dates']['after']['end']}

--------------------------------------------------
ANALYSIS METRICS:
--------------------------------------------------
- Deforested Area:          {metrics['changed_area_hectares']} Hectares
- Forest Loss Percentage:    {metrics['forest_loss_percentage']}%
- Encroachments Detected:    {metrics['encroachment_count']}
- Total Buildings Detected:  {metrics['total_buildings_detected']}
- Severity Classification:   {metrics['severity_score'].upper()}
{exec_text}
--------------------------------------------------
AI MODEL CONFIDENCE SCORES:
--------------------------------------------------
- Average U-Net Confidence:  {metrics['average_unet_confidence']}
- Average YOLOv8 Confidence: {metrics['average_yolo_confidence']}

--------------------------------------------------
Severity Thresholds:
- LOW:    < {config['thresholds']['severity']['low']}%
- MEDIUM: {config['thresholds']['severity']['low']}% - {config['thresholds']['severity']['medium']}%
- HIGH:   > {config['thresholds']['severity']['medium']}%
==================================================
"""
    with open(out_txt_path, 'w') as f:
        f.write(summary_text)
    print(f"Saved summary report to: {out_txt_path}")
