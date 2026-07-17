import os
import glob
from datetime import datetime
from services.history.history_utils import get_all_history

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
REPORTS_DIR = os.path.join(BASE_DIR, "outputs", "reports")

def get_platform_statistics() -> dict:
    history = get_all_history()
    
    total_analyses = len(history)
    high_risk_forests = len([h for h in history if h.get("severity") == "High"])
    
    # Calculate unique forests monitored
    unique_forests = set([h.get("forest_name") for h in history if h.get("forest_name")])
    forests_monitored = len(unique_forests)
    if forests_monitored == 0:
        forests_monitored = 3 # fallback to our demo default regions
        
    # Todays analyses
    today_str = datetime.now().strftime("%Y-%m-%d")
    todays_analyses = len([h for h in history if h.get("date") == today_str])
    
    # Count generated reports
    reports_generated = 0
    if os.path.exists(REPORTS_DIR):
        reports_generated = len(glob.glob(os.path.join(REPORTS_DIR, "*.pdf")))
        
    # Hardcoded context for our demo/platform scale
    protected_areas_covered = 14
    ai_models_deployed = 3 # U-Net, YOLOv8, Random Forest
    active_forest_officers = 42

    return {
        "forests_monitored": forests_monitored,
        "total_analyses": total_analyses,
        "high_risk_forests": high_risk_forests,
        "reports_generated": reports_generated,
        "protected_areas_covered": protected_areas_covered,
        "todays_analyses": todays_analyses,
        "ai_models_deployed": ai_models_deployed,
        "active_forest_officers": active_forest_officers,
    }

def get_workflow_steps() -> list:
    return [
        {
            "id": 1,
            "title": "Satellite Imagery",
            "description": "Multi-spectral Sentinel-2 optical data is retrieved.",
            "icon": "satellite"
        },
        {
            "id": 2,
            "title": "Image Preprocessing",
            "description": "Cloud removal and radiometric correction.",
            "icon": "layers"
        },
        {
            "id": 3,
            "title": "AI Analysis",
            "description": "U-Net & YOLOv8 detect changes and encroachments.",
            "icon": "cpu"
        },
        {
            "id": 4,
            "title": "Forest Change Detection",
            "description": "NDVI anomalies and canopy losses are mapped.",
            "icon": "map"
        },
        {
            "id": 5,
            "title": "Health Assessment",
            "description": "Ecological stability is scored using AI.",
            "icon": "activity"
        },
        {
            "id": 6,
            "title": "Interactive Reports",
            "description": "Bilingual PDF reports are automatically generated.",
            "icon": "file-text"
        }
    ]
