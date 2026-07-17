import os
import torch
import numpy as np
import cv2
from models.unet import UNet
from ultralytics import YOLO

def run_unet_inference(rgb_image, weights_path="weights/unet_forest_loss.pth", threshold=0.5, morphology_kernel_size=3):
    """
    Runs forest loss segmentation using the trained U-Net.
    Input:
        rgb_image: 8-bit numpy array (H, W, 3) -> RGB format.
    Returns:
        prob_map: 2D float32 numpy array [0.0, 1.0] of change probabilities.
        mask: 2D binary numpy array (0 or 255) of deforested areas.
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Running U-Net inference on: {device}")

    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"U-Net weights not found at: {weights_path}")

    # Initialize U-Net architecture
    model = UNet(n_channels=3, n_classes=1, bilinear=True)
    model.load_state_dict(torch.load(weights_path, map_location=device))
    model.to(device)
    model.eval()

    # Preprocess image
    # Scale to [0, 1], transpose to (C, H, W) and add batch dimension (1, C, H, W)
    input_data = rgb_image.astype(np.float32) / 255.0
    input_data = input_data.transpose(2, 0, 1)
    input_tensor = torch.tensor(input_data).unsqueeze(0).to(device)

    with torch.no_grad():
        logits = model(input_tensor)
        probs = torch.sigmoid(logits)
        
        # Remove batch and channel dimension, copy to CPU numpy
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

def run_yolov8_inference(rgb_image, weights_path="weights/yolov8_encroachment.pt", conf_threshold=0.25):
    """
    Runs building/encroachment detection using the trained YOLOv8 model.
    Input:
        rgb_image: 8-bit numpy array (H, W, 3) -> RGB format.
    Returns:
        detections: list of dictionaries, each containing:
                    - 'box': bounding box coordinates [x1, y1, x2, y2]
                    - 'conf': confidence score
                    - 'class': class ID
    """
    if not os.path.exists(weights_path):
        raise FileNotFoundError(f"YOLOv8 weights not found at: {weights_path}")

    # Load YOLOv8 model
    model = YOLO(weights_path)
    
    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"Running YOLOv8 inference on: {device}")

    # YOLOv8 expects BGR format or path, let's pass the image in BGR
    bgr_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2BGR)

    results = model.predict(
        source=bgr_image,
        conf=conf_threshold,
        device=device,
        verbose=False
    )

    detections = []
    if len(results) > 0:
        result = results[0]
        boxes = result.boxes
        for box in boxes:
            # Extract coordinates as int
            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy().astype(int).tolist()
            conf = float(box.conf[0].cpu().numpy())
            cls = int(box.cls[0].cpu().numpy())
            
            detections.append({
                'box': [x1, y1, x2, y2],
                'conf': conf,
                'class': cls
            })

    print(f"YOLOv8 detected {len(detections)} building/construction footprint(s).")
    return detections
