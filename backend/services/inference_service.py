import os
import torch
import numpy as np
import cv2

def run_unet_inference_loaded(unet_model, rgb_image, device, threshold=0.5, morphology_kernel_size=3):
    """
    Runs forest loss segmentation using the pre-loaded U-Net model.
    Avoids reloading weights from disk.
    """
    # Preprocess image
    # Scale to [0, 1], transpose to (C, H, W) and add batch dimension (1, C, H, W)
    input_data = rgb_image.astype(np.float32) / 255.0
    input_data = input_data.transpose(2, 0, 1)
    input_tensor = torch.tensor(input_data).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = unet_model(input_tensor)
        probs = torch.sigmoid(logits)
        # Remove batch and channel dimension
        prob_map = probs.squeeze(0).squeeze(0).cpu().numpy()

    # Apply threshold to get binary mask
    binary_mask = (prob_map > threshold).astype(np.uint8) * 255

    # Apply morphological opening and closing to clean noise and fill gaps
    if morphology_kernel_size > 0:
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (morphology_kernel_size, morphology_kernel_size))
        # 1. Opening: erosion followed by dilation to remove isolated pixels
        opened = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel)
        # 2. Closing: dilation followed by erosion to fill gaps
        binary_mask = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel)

    return prob_map, binary_mask

def run_yolov8_inference_loaded(yolo_model, rgb_image, device, conf_threshold=0.25):
    """
    Runs building/encroachment detection using the pre-loaded YOLOv8 model.
    Avoids reloading weights from disk.
    """
    # Convert RGB to BGR for OpenCV / YOLO input compatibility
    bgr_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)

    # Resolve device format for YOLOv8 (either CPU string or GPU index number e.g. 0)
    yolo_device = "cpu"
    if device.type == "cuda":
        yolo_device = str(device.index) if device.index is not None else "0"

    results = yolo_model.predict(
        source=bgr_image,
        conf=conf_threshold,
        device=yolo_device,
        verbose=False
    )

    detections = []
    if len(results) > 0:
        result = results[0]
        boxes = result.boxes
        for box in boxes:
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int).tolist()
            conf = float(box.conf[0].cpu().numpy())
            cls = int(box.cls[0].cpu().numpy())
            
            detections.append({
                'box': [x1, y1, x2, y2],
                'conf': conf,
                'class': cls
            })

    return detections
