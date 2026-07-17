import os
import json
import uuid
import random
from datetime import datetime, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_FILE = os.path.join(BASE_DIR, "config", "historical_trends.json")

def _generate_dummy_data():
    """Generates 12 months of dummy historical data."""
    forest_names = ["Satpura Tiger Reserve", "Kanha Sanctuary", "Pench National Park"]
    data = []
    
    # Generate one record per month for the past year
    for i in range(12, -1, -1):
        record_date = (datetime.now() - timedelta(days=30 * i)).strftime("%Y-%m-%d")
        # Simulating a slight improvement trend over time
        loss_pct = round(random.uniform(10.0, 15.0) - (12 - i) * 0.3, 2)
        ndvi = round(random.uniform(0.2, 0.4) + (12 - i) * 0.01, 3)
        illegal = max(0, random.randint(2, 10) - (12 - i) // 2)
        human_activity = min(100, illegal * 8 + random.randint(5, 15))
        
        health_score = int(100 - (loss_pct * 2.5) - (illegal * 3))
        health_score = max(15, min(100, health_score))
        
        severity = "High" if loss_pct > 10 else "Medium" if loss_pct > 5 else "Low"
        
        item = {
            "id": str(uuid.uuid4())[:8],
            "date": record_date,
            "forest_name": random.choice(forest_names),
            "forest_loss_percentage": max(0.0, loss_pct),
            "forest_health_score": health_score,
            "ndvi": ndvi,
            "severity": severity,
            "illegal_structures": illegal,
            "human_activity_score": human_activity,
            "output_files": {
                "heatmap": "/static/heatmap.png",
                "change_mask": "/static/change_mask.png",
                "combined_result": "/static/combined_result.png",
                "before_rgb": "/static/before_rgb.png",
                "after_rgb": "/static/after_rgb.png"
            },
            "status": "Completed"
        }
        data.insert(0, item) # newest first
    return data

def get_all_history():
    """Returns all historical records from the dummy JSON DB."""
    if not os.path.exists(DB_FILE):
        os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
        dummy = _generate_dummy_data()
        save_history(dummy)
        return dummy
        
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return []

def save_history(data):
    """Saves historical records to the dummy JSON DB."""
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

def get_history_by_id(analysis_id: str):
    data = get_all_history()
    for item in data:
        if item.get("id") == analysis_id:
            return item
    return None
