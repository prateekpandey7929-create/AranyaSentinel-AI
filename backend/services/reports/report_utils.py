import os
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
REPORTS_DIR = os.path.join(BASE_DIR, "outputs", "reports")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

# Ensure directories exist
os.makedirs(REPORTS_DIR, exist_ok=True)

def generate_report_id() -> str:
    """Generates a unique ID for the report based on timestamp."""
    return f"AS_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

def list_generated_reports() -> list:
    """Returns a list of generated reports metadata."""
    if not os.path.exists(REPORTS_DIR):
        return []
    
    reports = []
    for file in os.listdir(REPORTS_DIR):
        if file.endswith(".pdf"):
            path = os.path.join(REPORTS_DIR, file)
            stat = os.stat(path)
            reports.append({
                "id": file.replace(".pdf", ""),
                "filename": file,
                "timestamp": stat.st_mtime,
                "date_str": datetime.fromtimestamp(stat.st_mtime).strftime("%d %b %Y, %H:%M"),
                "size_kb": round(stat.st_size / 1024, 1),
                "url": f"/report/download/{file.replace('.pdf', '')}"
            })
    # Sort descending
    reports.sort(key=lambda x: x["timestamp"], reverse=True)
    return reports

def get_report_path(report_id: str) -> str:
    """Returns the absolute file path for a report ID."""
    return os.path.join(REPORTS_DIR, f"{report_id}.pdf")
