import os
import glob
import shutil
import cv2
import numpy as np
from dotenv import load_dotenv
from roboflow import Roboflow
import albumentations as A

# Load environment variables
load_dotenv()

ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY")

def create_dirs(paths):
    for path in paths:
        if not os.path.exists(path):
            os.makedirs(path)
            print(f"Created directory: {path}")

def download_datasets():
    if not ROBOFLOW_API_KEY or ROBOFLOW_API_KEY == "your_roboflow_api_key_here":
        print("[WARNING] Roboflow API key is not set in .env. Programmatic download will skip.")
        print("Please configure ROBOFLOW_API_KEY in the .env file.")
        return False

    print("Initializing Roboflow...")
    rf = Roboflow(api_key=ROBOFLOW_API_KEY)

    # 1. Download Forest Change Detection Dataset (U-Net)
    forest_dir = "data/forest_change"
    if not os.path.exists(forest_dir) or len(os.listdir(forest_dir)) == 0:
        print("Downloading Forest Change Detection Dataset...")
        try:
            # project: forest-change-detection-5oh6a, version 1
            project = rf.workspace("madhu-patel-anw8s").project("forest-change-detection-5oh6a")
            # We use 'png-mask-semantic' format since U-Net requires semantic masks
            dataset = project.version(1).download("png-mask-semantic", location=forest_dir)
            print(f"Forest Change dataset downloaded to {forest_dir}")
        except Exception as e:
            print(f"Error downloading Forest Change dataset: {e}")
    else:
        print("Forest Change dataset already exists. Skipping download.")

    # 2. Download Building/Construction Detection Dataset (YOLOv8)
    encroachment_dir = "data/encroachment"
    if not os.path.exists(encroachment_dir) or len(os.listdir(encroachment_dir)) == 0:
        print("Downloading Building/Construction Detection Dataset...")
        try:
            project = rf.workspace("ilvinas-jusius").project("building-detection-from-satellite-images-qocjo")
            dataset = project.version(1).download("yolov8", location=encroachment_dir)
            print(f"Encroachment dataset downloaded to {encroachment_dir}")
        except Exception as e:
            print(f"Error downloading Encroachment dataset: {e}")
    else:
        print("Encroachment dataset already exists. Skipping download.")

    return True

def restructure_forest_dataset():
    """
    Roboflow downloads the images and masks flat in train/valid/test folders.
    This script restructures them into images/ and masks/ folders.
    """
    print("Restructuring Forest Change dataset to standard images/ and masks/ folders...")
    root_dir = "data/forest_change"
    
    for split in ['train', 'valid', 'test']:
        split_dir = os.path.join(root_dir, split)
        if not os.path.exists(split_dir):
            continue
            
        images_dir = os.path.join(split_dir, "images")
        masks_dir = os.path.join(split_dir, "masks")
        
        # If already restructured, skip
        if os.path.exists(images_dir) and os.path.exists(masks_dir) and len(os.listdir(images_dir)) > 0:
            print(f"Split '{split}' already restructured.")
            continue
            
        os.makedirs(images_dir, exist_ok=True)
        os.makedirs(masks_dir, exist_ok=True)
        
        files = glob.glob(os.path.join(split_dir, "*"))
        count_img = 0
        count_mask = 0
        
        for f in files:
            if os.path.isdir(f):
                continue
            filename = os.path.basename(f)
            
            # Identify mask files
            if filename.endswith("_mask.png") or "_mask" in filename:
                shutil.move(f, os.path.join(masks_dir, filename))
                count_mask += 1
            # Identify image files
            elif filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                shutil.move(f, os.path.join(images_dir, filename))
                count_img += 1
                
        print(f"Restructured split '{split}': moved {count_img} images and {count_mask} masks.")

def augment_forest_dataset(target_samples=1000):
    print("Starting Data Augmentation for Forest Change dataset...")
    train_img_dir = "data/forest_change/train/images"
    train_mask_dir = "data/forest_change/train/masks"

    if not os.path.exists(train_img_dir) or not os.path.exists(train_mask_dir):
        print(f"[ERROR] Source folders for augmentation not found:\nImages: {train_img_dir}\nMasks: {train_mask_dir}")
        return

    img_files = glob.glob(os.path.join(train_img_dir, "*"))
    # Filter only images
    img_files = [f for f in img_files if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
    num_original = len(img_files)

    if num_original == 0:
        print("[ERROR] No images found in training folder for augmentation.")
        return

    print(f"Found {num_original} original training images.")
    if num_original >= target_samples:
        print("Dataset already contains target number of samples. Augmentation skipped.")
        return

    # Define augmentation pipeline using Albumentations
    # Target image size is 256x256 to fit 4GB GPU VRAM
    aug_pipeline = A.Compose([
        A.Resize(256, 256),
        A.HorizontalFlip(p=0.5),
        A.VerticalFlip(p=0.5),
        A.RandomRotate90(p=0.5),
        A.ShiftScaleRotate(shift_limit=0.0625, scale_limit=0.1, rotate_limit=45, p=0.5),
        A.RandomBrightnessContrast(p=0.3),
        A.GaussNoise(p=0.2),
    ])

    # Resize pipeline for original images to ensure consistent dimensions
    resize_pipeline = A.Resize(256, 256)

    # First, resize all existing original images and masks to 256x256
    print("Resizing original training images to 256x256...")
    for img_path in img_files:
        filename = os.path.basename(img_path)
        base, _ = os.path.splitext(filename)
        mask_filename = f"{base}_mask.png"
        mask_path = os.path.join(train_mask_dir, mask_filename)
        
        if not os.path.exists(mask_path):
            # Try fallback matching mask files with different extensions/formats
            possible_masks = glob.glob(os.path.join(train_mask_dir, f"{base}_mask.*"))
            if possible_masks:
                mask_path = possible_masks[0]
            else:
                print(f"[WARNING] Mask not found for image: {filename}. Expected: {mask_filename}. Skipping.")
                continue

        img = cv2.imread(img_path)
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)

        if img is None or mask is None:
            continue

        resized = resize_pipeline(image=img, mask=mask)
        cv2.imwrite(img_path, resized['image'])
        cv2.imwrite(mask_path, resized['mask'])

    # Calculate how many augmentations per image are needed
    augs_needed = target_samples - num_original
    augs_per_img = int(np.ceil(augs_needed / num_original))
    print(f"Creating ~{augs_per_img} augmented copies per image to reach {target_samples} total samples...")

    count = 0
    for img_path in img_files:
        filename = os.path.basename(img_path)
        base, ext = os.path.splitext(filename)
        mask_filename = f"{base}_mask.png"
        mask_path = os.path.join(train_mask_dir, mask_filename)

        if not os.path.exists(mask_path):
            possible_masks = glob.glob(os.path.join(train_mask_dir, f"{base}_mask.*"))
            if possible_masks:
                mask_path = possible_masks[0]
            else:
                continue

        img = cv2.imread(img_path)
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)

        if img is None or mask is None:
            continue

        for i in range(augs_per_img):
            if num_original + count >= target_samples:
                break
            
            augmented = aug_pipeline(image=img, mask=mask)
            aug_img = augmented['image']
            aug_mask = augmented['mask']

            aug_filename = f"aug_{i}_{filename}"
            cv2.imwrite(os.path.join(train_img_dir, aug_filename), aug_img)
            
            # Save corresponding mask
            aug_mask_filename = f"aug_{i}_{base}_mask.png"
            cv2.imwrite(os.path.join(train_mask_dir, aug_mask_filename), aug_mask)
            count += 1

    print(f"Augmentation complete. Created {count} augmented training samples.")
    total_imgs = len(glob.glob(os.path.join(train_img_dir, "*")))
    print(f"Total training images in folder now: {total_imgs}")

if __name__ == "__main__":
    # Create basic data structure
    create_dirs(["data", "weights"])
    
    # Download datasets
    downloaded = download_datasets()
    
    # Restructure forest dataset splits
    if downloaded or os.path.exists("data/forest_change/train"):
        restructure_forest_dataset()
        augment_forest_dataset(target_samples=1000)
    else:
        print("[INFO] Please configure your .env file and run this script again to download and prepare the datasets.")
