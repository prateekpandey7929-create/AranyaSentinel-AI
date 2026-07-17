import os
import glob
import cv2
import argparse
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
import matplotlib.pyplot as plt
from models.unet import UNet

class ForestDataset(Dataset):
    def __init__(self, img_dir, mask_dir, transform=None):
        self.img_dir = img_dir
        self.mask_dir = mask_dir
        self.img_paths = sorted(glob.glob(os.path.join(img_dir, "*")))
        self.img_paths = [f for f in self.img_paths if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        self.transform = transform

    def __len__(self):
        return len(self.img_paths)

    def __getitem__(self, idx):
        img_path = self.img_paths[idx]
        filename = os.path.basename(img_path)
        base, _ = os.path.splitext(filename)
        mask_filename = f"{base}_mask.png"
        mask_path = os.path.join(self.mask_dir, mask_filename)

        if not os.path.exists(mask_path):
            # Try to match mask file with other extensions/names if mismatch
            possible_masks = glob.glob(os.path.join(self.mask_dir, f"{base}_mask.*"))
            if possible_masks:
                mask_path = possible_masks[0]
            else:
                raise FileNotFoundError(f"Mask not found for image: {img_path} in {self.mask_dir}. Expected mask name: {mask_filename}")

        image = cv2.imread(img_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Read mask as grayscale
        mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
        
        # Normalize and convert image to float32
        image = image.astype(np.float32) / 255.0
        # Transpose image to (C, H, W)
        image = image.transpose(2, 0, 1)

        # Normalize and threshold mask to binary (0.0 or 1.0)
        mask = mask.astype(np.float32) / 255.0
        mask = (mask > 0.5).astype(np.float32)
        # Add channel dimension to mask (1, H, W)
        mask = np.expand_dims(mask, axis=0)

        return torch.tensor(image), torch.tensor(mask)

class DiceLoss(nn.Module):
    def __init__(self, smooth=1.0):
        super(DiceLoss, self).__init__()
        self.smooth = smooth

    def forward(self, logits, targets):
        probs = torch.sigmoid(logits)
        probs = probs.view(-1)
        targets = targets.view(-1)
        
        intersection = (probs * targets).sum()
        dice = (2. * intersection + self.smooth) / (probs.sum() + targets.sum() + self.smooth)
        return 1 - dice

class BCEDiceLoss(nn.Module):
    def __init__(self, bce_weight=0.5, smooth=1.0):
        super(BCEDiceLoss, self).__init__()
        self.bce = nn.BCEWithLogitsLoss()
        self.dice = DiceLoss(smooth)
        self.bce_weight = bce_weight

    def forward(self, logits, targets):
        bce_loss = self.bce(logits, targets)
        dice_loss = self.dice(logits, targets)
        return self.bce_weight * bce_loss + (1 - self.bce_weight) * dice_loss

def calculate_iou(logits, targets, threshold=0.5):
    probs = torch.sigmoid(logits)
    preds = (probs > threshold).float()
    
    intersection = (preds * targets).sum()
    union = preds.sum() + targets.sum() - intersection
    
    # Avoid division by zero
    if union == 0:
        return 1.0 if targets.sum() == 0 else 0.0
        
    return (intersection / union).item()

def train_unet(epochs=20, batch_size=8, lr=1e-4):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device for U-Net training: {device}")

    # Set up datasets
    train_dataset = ForestDataset("data/forest_change/train/images", "data/forest_change/train/masks")
    
    # Verify dataset exists and has items
    if len(train_dataset) == 0:
        print("[ERROR] Train dataset is empty! Please run src/dataset_prep.py first.")
        return

    # Check for val directory; fall back to train if not exists (for simple check)
    val_img_dir = "data/forest_change/valid/images"
    val_mask_dir = "data/forest_change/valid/masks"
    if not os.path.exists(val_img_dir):
        # Roboflow sometimes uses 'val' instead of 'valid'
        val_img_dir = "data/forest_change/val/images"
        val_mask_dir = "data/forest_change/val/masks"

    if os.path.exists(val_img_dir):
        val_dataset = ForestDataset(val_img_dir, val_mask_dir)
        print(f"Validation dataset size: {len(val_dataset)}")
    else:
        print("[WARNING] Validation dataset directory not found. Using train dataset for validation split.")
        val_dataset = train_dataset

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # Initialize model
    model = UNet(n_channels=3, n_classes=1, bilinear=True).to(device)

    # Loss and Optimizer
    criterion = BCEDiceLoss(bce_weight=0.5)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr)

    best_val_loss = float('inf')
    history = {'train_loss': [], 'val_loss': [], 'train_iou': [], 'val_iou': []}

    print(f"Starting training on {len(train_dataset)} images for {epochs} epochs...")

    for epoch in range(1, epochs + 1):
        # Training Phase
        model.train()
        train_loss = 0.0
        train_iou = 0.0
        
        for images, masks in train_loader:
            images = images.to(device)
            masks = masks.to(device)

            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, masks)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            train_iou += calculate_iou(outputs, masks) * images.size(0)

        train_loss = train_loss / len(train_loader.dataset)
        train_iou = train_iou / len(train_loader.dataset)

        # Validation Phase
        model.eval()
        val_loss = 0.0
        val_iou = 0.0
        
        with torch.no_grad():
            for images, masks in val_loader:
                images = images.to(device)
                masks = masks.to(device)

                outputs = model(images)
                loss = criterion(outputs, masks)

                val_loss += loss.item() * images.size(0)
                val_iou += calculate_iou(outputs, masks) * images.size(0)

        val_loss = val_loss / len(val_loader.dataset)
        val_iou = val_iou / len(val_loader.dataset)

        history['train_loss'].append(train_loss)
        history['val_loss'].append(val_loss)
        history['train_iou'].append(train_iou)
        history['val_iou'].append(val_iou)

        print(f"Epoch [{epoch}/{epochs}] - Train Loss: {train_loss:.4f}, Train IoU: {train_iou:.4f} | Val Loss: {val_loss:.4f}, Val IoU: {val_iou:.4f}")

        # Save Best Model Checkpoint
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            os.makedirs("weights", exist_ok=True)
            torch.save(model.state_dict(), "weights/unet_forest_loss.pth")
            print(f"  --> Saved new best checkpoint with Val Loss: {val_loss:.4f}")

    print("Training finished.")
    
    # Save training charts
    plot_training_history(history)
    print("Saved training metrics plot to weights/unet_training_history.png")

def plot_training_history(history):
    epochs = range(1, len(history['train_loss']) + 1)
    
    plt.figure(figsize=(12, 5))

    # Loss Plot
    plt.subplot(1, 2, 1)
    plt.plot(epochs, history['train_loss'], 'g-', label='Train Loss')
    plt.plot(epochs, history['val_loss'], 'b-', label='Val Loss')
    plt.title('Training and Validation Loss')
    plt.xlabel('Epochs')
    plt.ylabel('Loss')
    plt.legend()
    plt.grid(True)

    # IoU Plot
    plt.subplot(1, 2, 2)
    plt.plot(epochs, history['train_iou'], 'g-', label='Train IoU')
    plt.plot(epochs, history['val_iou'], 'b-', label='Val IoU')
    plt.title('Training and Validation IoU')
    plt.xlabel('Epochs')
    plt.ylabel('IoU')
    plt.legend()
    plt.grid(True)

    os.makedirs("weights", exist_ok=True)
    plt.savefig("weights/unet_training_history.png")
    plt.close()

if __name__ == "__main__":
    import numpy as np
    
    parser = argparse.ArgumentParser(description="Train Lightweight U-Net for Forest Loss Segmentation")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=8, help="Batch size (RTX 2050 recommendation: 4-8)")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate")
    args = parser.parse_args()

    train_unet(epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)
