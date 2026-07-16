import os
import shutil
import glob
import yaml
import argparse
from ultralytics import YOLO
import torch

def fix_yolo_yaml(yaml_path):
    """
    Ensures that the paths in data.yaml are correct and absolute.
    Roboflow sometimes writes relative paths that are incorrect relative to our script execution folder.
    """
    if not os.path.exists(yaml_path):
        print(f"[WARNING] YOLO dataset configuration YAML not found at {yaml_path}")
        return False
        
    try:
        with open(yaml_path, 'r') as f:
            data = yaml.safe_load(f)
        
        # Resolve dataset root path
        dataset_root = os.path.dirname(yaml_path)
        data['path'] = os.path.abspath(dataset_root)
        
        # Make sure train/val/test are correct relative to path
        if 'train' in data and not data['train'].startswith('train'):
            data['train'] = 'train/images'
        if 'val' in data and not data['val'].startswith('val'):
            data['val'] = 'valid/images'
        if 'test' in data and not data['test'].startswith('test'):
            data['test'] = 'test/images'
            
        with open(yaml_path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False)
            
        print(f"Successfully verified and updated YOLO data.yaml paths at {yaml_path}")
        return True
    except Exception as e:
        print(f"Error adjusting YOLO data.yaml: {e}")
        return False

def train_yolov8(epochs=15, batch_size=8, imgsz=320):
    device = "0" if torch.cuda.is_available() else "cpu"
    print(f"Using device for YOLOv8 training: {device}")
    
    yaml_path = "data/encroachment/data.yaml"
    if not os.path.exists(yaml_path):
        print("[ERROR] YOLO configuration file 'data/encroachment/data.yaml' not found.")
        print("Please run src/dataset_prep.py first.")
        return

    # Fix the data.yaml paths before training
    fix_yolo_yaml(yaml_path)

    print("Loading YOLOv8 Nano pre-trained model (for lightweight training)...")
    # Load YOLOv8 Nano model (pretrained on COCO)
    model = YOLO("yolov8n.pt")

    print(f"Starting YOLOv8 training for {epochs} epochs (imgsz={imgsz}, batch={batch_size})...")
    
    # Train the model
    # We specify project='runs/detect' and name='encroachment' to have a clean, predictable output folder
    results = model.train(
        data=yaml_path,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch_size,
        device=device,
        project="runs/detect",
        name="encroachment_train",
        exist_ok=True # Overwrite directory if it exists to keep it simple and clean
    )

    print("Training finished.")

    # Locate the best weights file
    best_weights_src = "runs/detect/encroachment_train/weights/best.pt"
    
    if os.path.exists(best_weights_src):
        os.makedirs("weights", exist_ok=True)
        best_weights_dst = "weights/yolov8_encroachment.pt"
        shutil.copy(best_weights_src, best_weights_dst)
        print(f"Successfully copied best weights from {best_weights_src} to {best_weights_dst}!")
    else:
        print(f"[WARNING] Best weights file not found at {best_weights_src}. Checking fallback runs...")
        # Search for any 'best.pt' in runs folder
        possible_weights = glob.glob("runs/detect/**/weights/best.pt", recursive=True)
        if possible_weights:
            os.makedirs("weights", exist_ok=True)
            shutil.copy(possible_weights[-1], "weights/yolov8_encroachment.pt")
            print(f"Copied weights from fallback location: {possible_weights[-1]}")
        else:
            print("[ERROR] Could not find trained YOLOv8 weights file.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train YOLOv8 Nano for Encroachment Detection")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=8, help="Batch size (RTX 2050 recommendation: 4-8)")
    parser.add_argument("--imgsz", type=int, default=320, help="Image size (RTX 2050 recommendation: 320 or 416)")
    args = parser.parse_args()

    train_yolov8(epochs=args.epochs, batch_size=args.batch_size, imgsz=args.imgsz)
