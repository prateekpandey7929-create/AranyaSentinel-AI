import os
import cv2
import numpy as np

def generate_change_mask(change_mask, out_path):
    """
    Saves the binary change mask as a black and white PNG image.
    """
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    # Convert bool or uint8 [0, 1] to [0, 255]
    mask_img = (change_mask.astype(np.uint8) * 255)
    cv2.imwrite(out_path, mask_img)
    print(f"Saved binary change mask to: {out_path}")

def generate_heatmap(after_rgb, change_mask, out_path):
    """
    Generates a high-quality heatmap overlaying density of change on the After RGB image.
    """
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    
    # 1. Convert change mask to float and apply Gaussian Blur for density estimation
    mask_float = change_mask.astype(np.float32)
    # Large kernel size creates smooth density plots
    blurred = cv2.GaussianBlur(mask_float, (31, 31), 0)
    
    # Normalize blurred density map to [0, 255]
    max_val = np.max(blurred)
    if max_val > 0:
        blurred = (blurred / max_val * 255).astype(np.uint8)
    else:
        blurred = np.zeros_like(change_mask, dtype=np.uint8)
        
    # 2. Apply COLORMAP_JET to get a heatmap color scale (blue-to-red)
    heatmap_color = cv2.applyColorMap(blurred, cv2.COLORMAP_JET)
    
    # 3. Blend heatmap color with After RGB image where changes occurred
    # We convert after_rgb from RGB to BGR for cv2 processing
    after_bgr = cv2.cvtColor(after_rgb, cv2.COLOR_RGB2BGR)
    
    # Create mask of active heatmap areas to overlay only where density > 10
    heatmap_mask = (blurred > 10)[:, :, np.newaxis]
    
    # Blend overlay: 50% image, 50% heatmap
    blended = cv2.addWeighted(after_bgr, 0.5, heatmap_color, 0.5, 0)
    
    # Apply blend only to the mask, keep original image elsewhere
    heatmap_overlay = np.where(heatmap_mask, blended, after_bgr)
    
    cv2.imwrite(out_path, heatmap_overlay)
    print(f"Saved heatmap overlay to: {out_path}")
    return heatmap_overlay

def generate_combined_dashboard(before_rgb, after_rgb, ndvi_diff, heatmap_overlay, encroachments, out_path):
    """
    Creates a premium 2x2 grid dashboard combining:
    - Before RGB
    - After RGB + Encroachment Boxes
    - NDVI Difference Map
    - Deforestation Heatmap Overlay
    """
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    
    # Set sizes (height, width)
    h, w = before_rgb.shape[:2]
    
    # Panel 1: Before RGB
    p1 = cv2.cvtColor(before_rgb, cv2.COLOR_RGB2BGR)
    cv2.putText(p1, "1. Before Image (RGB)", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Panel 2: After RGB + Encroachments
    p2 = cv2.cvtColor(after_rgb, cv2.COLOR_RGB2BGR)
    for enc in encroachments:
        x1, y1, x2, y2 = enc['box']
        conf = enc['conf']
        # Draw red bounding box for encroachment
        cv2.rectangle(p2, (x1, y1), (x2, y2), (0, 0, 255), 2)
        # Label
        cv2.putText(p2, f"Encroach {conf:.2f}", (x1, max(y1 - 5, 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
    cv2.putText(p2, f"2. After (Encroachments: {len(encroachments)})", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Panel 3: NDVI Difference Map (normalized to colormap for visualization)
    # Clip NDVI diff to [0, 1] range for visual scaling (positive is loss)
    ndvi_diff_clipped = np.clip(ndvi_diff, 0, 1)
    ndvi_diff_8bit = (ndvi_diff_clipped * 255).astype(np.uint8)
    p3_color = cv2.applyColorMap(ndvi_diff_8bit, cv2.COLORMAP_HOT)
    p3 = p3_color.copy()
    cv2.putText(p3, "3. NDVI Difference Map", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Panel 4: Heatmap Overlay
    p4 = heatmap_overlay.copy()
    cv2.putText(p4, "4. Deforestation Heatmap", (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Make grid
    top_row = np.hstack((p1, p2))
    bottom_row = np.hstack((p3, p4))
    dashboard = np.vstack((top_row, bottom_row))
    
    cv2.imwrite(out_path, dashboard)
    print(f"Saved combined dashboard visualization to: {out_path}")
