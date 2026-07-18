import os
import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import torch

# Resolve absolute path to project root to import 'src'
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, 'src'))

# Import model architectures and GEE initialization
from models.unet import UNet
from ultralytics import YOLO
from gee_download import init_gee

# Setup directories
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')
WEIGHTS_DIR = os.path.join(BASE_DIR, 'weights')
LOGS_DIR = os.path.join(BASE_DIR, 'backend', 'logs')

os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

# Setup Logging
log_file_path = os.path.join(LOGS_DIR, 'backend.log')
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(log_file_path),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("backend")
logger.info("Initializing FastAPI Backend server...")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager. Runs on server startup and shutdown.
    Loads AI models once into memory.
    """
    logger.info("Lifespan startup: Initializing Earth Engine and loading model weights...")
    
    # Clear old outputs to guarantee fresh startup state
    logger.info("Cleaning outputs directory of stale files...")
    for filename in os.listdir(OUTPUTS_DIR):
        if filename == "reports":
            continue
        file_path = os.path.join(OUTPUTS_DIR, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                import shutil
                shutil.rmtree(file_path)
        except Exception as e:
            logger.warning(f"Failed to delete {file_path}: {e}")
    # Initialize GEE
    try:
        init_gee()
    except Exception as e:
        logger.error(f"GEE Initialization failed at startup: {e}")
        raise RuntimeError(f"GEE Initialization failed: {e}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Inference device: {device}")

    # 1. Load U-Net model
    unet_weights = os.path.join(WEIGHTS_DIR, "unet_forest_loss.pth")
    if not os.path.exists(unet_weights):
        logger.error(f"U-Net weights missing at: {unet_weights}")
        raise FileNotFoundError(f"U-Net weights missing at: {unet_weights}")
        
    logger.info(f"Loading U-Net weights from: {unet_weights}")
    unet_model = UNet(n_channels=3, n_classes=1, bilinear=True)
    unet_model.load_state_dict(torch.load(unet_weights, map_location=device))
    unet_model.to(device)
    unet_model.eval()

    # 2. Load YOLOv8 model
    yolo_weights = os.path.join(WEIGHTS_DIR, "yolov8_encroachment.pt")
    if not os.path.exists(yolo_weights):
        logger.error(f"YOLOv8 weights missing at: {yolo_weights}")
        raise FileNotFoundError(f"YOLOv8 weights missing at: {yolo_weights}")
        
    logger.info(f"Loading YOLOv8 weights from: {yolo_weights}")
    yolo_model = YOLO(yolo_weights)

    # Store models in the FastAPI global state
    app.state.unet = unet_model
    app.state.yolo = yolo_model
    app.state.device = device
    logger.info("AI models pre-loaded in memory successfully!")
    
    yield
    
    # Shutdown / Cleanup
    logger.info("Lifespan shutdown: Cleaning up resources...")
    del app.state.unet
    del app.state.yolo
    logger.info("Server stopped successfully.")

# Create FastAPI application
app = FastAPI(
    title="AI Forest Loss Monitoring System API",
    description="Backend API exposing Earth Engine downloads, NDVI calculation, and U-Net / YOLOv8 model inference.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware (for React dashboard connectivity)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated output assets (images, maps, reports) as static files
app.mount("/static", StaticFiles(directory=OUTPUTS_DIR), name="static")
logger.info(f"Mounted static outputs route at: /static (pointing to {OUTPUTS_DIR})")

# Register routes
import os
import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import torch

# Resolve absolute path to project root to import 'src'
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, 'src'))

# Import model architectures and GEE initialization
from models.unet import UNet
from ultralytics import YOLO
from gee_download import init_gee

# Setup directories
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')
WEIGHTS_DIR = os.path.join(BASE_DIR, 'weights')
LOGS_DIR = os.path.join(BASE_DIR, 'backend', 'logs')

os.makedirs(OUTPUTS_DIR, exist_ok=True)
os.makedirs(LOGS_DIR, exist_ok=True)

# Setup Logging
log_file_path = os.path.join(LOGS_DIR, 'backend.log')
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(log_file_path),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("backend")
logger.info("Initializing FastAPI Backend server...")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager. Runs on server startup and shutdown.
    Loads AI models once into memory.
    """
    logger.info("Lifespan startup: Initializing Earth Engine and loading model weights...")
    
    # Clear old outputs to guarantee fresh startup state
    logger.info("Cleaning outputs directory of stale files...")
    for filename in os.listdir(OUTPUTS_DIR):
        if filename == "reports":
            continue
        file_path = os.path.join(OUTPUTS_DIR, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                import shutil
                shutil.rmtree(file_path)
        except Exception as e:
            logger.warning(f"Failed to delete {file_path}: {e}")
    # Initialize GEE
    try:
        init_gee()
    except Exception as e:
        logger.error(f"GEE Initialization failed at startup: {e}")
        raise RuntimeError(f"GEE Initialization failed: {e}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Inference device: {device}")

    # 1. Load U-Net model
    unet_weights = os.path.join(WEIGHTS_DIR, "unet_forest_loss.pth")
    if not os.path.exists(unet_weights):
        logger.error(f"U-Net weights missing at: {unet_weights}")
        raise FileNotFoundError(f"U-Net weights missing at: {unet_weights}")
        
    logger.info(f"Loading U-Net weights from: {unet_weights}")
    unet_model = UNet(n_channels=3, n_classes=1, bilinear=True)
    unet_model.load_state_dict(torch.load(unet_weights, map_location=device))
    unet_model.to(device)
    unet_model.eval()

    # 2. Load YOLOv8 model
    yolo_weights = os.path.join(WEIGHTS_DIR, "yolov8_encroachment.pt")
    if not os.path.exists(yolo_weights):
        logger.error(f"YOLOv8 weights missing at: {yolo_weights}")
        raise FileNotFoundError(f"YOLOv8 weights missing at: {yolo_weights}")
        
    logger.info(f"Loading YOLOv8 weights from: {yolo_weights}")
    yolo_model = YOLO(yolo_weights)

    # Store models in the FastAPI global state
    app.state.unet = unet_model
    app.state.yolo = yolo_model
    app.state.device = device
    logger.info("AI models pre-loaded in memory successfully!")
    
    # Start Alert Scheduler
    start_scheduler()
    
    yield
    
    # Shutdown / Cleanup
    logger.info("Lifespan shutdown: Cleaning up resources...")
    stop_scheduler()
    del app.state.unet
    del app.state.yolo
    logger.info("Server stopped successfully.")

# Create FastAPI application
app = FastAPI(
    title="AI Forest Loss Monitoring System API",
    description="Backend API exposing Earth Engine downloads, NDVI calculation, and U-Net / YOLOv8 model inference.",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware (for React dashboard connectivity)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated output assets (images, maps, reports) as static files
app.mount("/static", StaticFiles(directory=OUTPUTS_DIR), name="static")
logger.info(f"Mounted static outputs route at: /static (pointing to {OUTPUTS_DIR})")

# Register routes
sys.path.append(os.path.join(BASE_DIR, 'backend'))
from api.routes import router as main_router
from services.reports.report_router import router as report_router
from services.history.history_router import router as history_router
from services.knowledge.knowledge_router import router as knowledge_router
from services.dashboard.dashboard_router import router as dashboard_router
from localization.translation_router import router as translation_router
from notifications.notification_router import router as notification_router
from alerts.alert_router import router as alert_router
from alerts.scheduler import start_scheduler, stop_scheduler

app.include_router(main_router)
app.include_router(report_router, prefix="/report", tags=["Reports"])
app.include_router(history_router, prefix="/history", tags=["History"])
app.include_router(knowledge_router, prefix="/knowledge", tags=["Knowledge"])
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(notification_router, prefix="/api", tags=["notifications"])
app.include_router(translation_router, prefix="/localization", tags=["Localization"])
app.include_router(alert_router, prefix="/api", tags=["Alerts"])
logger.info("Registered API routes successfully.")
