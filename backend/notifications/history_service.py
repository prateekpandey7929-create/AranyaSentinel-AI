import json
import os
import glob
from typing import List, Optional
from datetime import datetime
from .notification_models import AnalysisHistoryRecord

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HISTORY_FILE = os.path.join(BASE_DIR, 'config', 'history.json')
OUTPUTS_DIR = os.path.join(BASE_DIR, 'outputs')

def get_analysis_history() -> List[AnalysisHistoryRecord]:
    """
    Combines legacy history.json with active severity.json to form a full AnalysisHistoryRecord list.
    """
    records = []
    
    # Check active analysis output
    severity_path = os.path.join(OUTPUTS_DIR, "severity.json")
    if os.path.exists(severity_path):
        try:
            with open(severity_path, 'r') as f:
                sev_data = json.load(f)
                
            # See if a report exists for the latest analysis
            reports = glob.glob(os.path.join(OUTPUTS_DIR, "reports", "*.pdf"))
            latest_report_id = None
            if reports:
                reports.sort(key=os.path.getmtime, reverse=True)
                latest_report_id = os.path.basename(reports[0]).replace(".pdf", "")

            timestamp = os.path.getmtime(severity_path)
            dt = datetime.fromtimestamp(timestamp)
            
            # Map values, handling missing keys gracefully
            score = sev_data.get("health_score", 0)
            if isinstance(score, str) and "/" in score:
                score = int(score.split("/")[0])
                
            records.append(AnalysisHistoryRecord(
                analysis_id=f"AN_{dt.strftime('%Y%m%d%H%M%S')}",
                forest_name=sev_data.get("forest_name", "Satpura Tiger Reserve"),
                date=dt.strftime("%d %b %Y"),
                time=dt.strftime("%H:%M"),
                status="Completed",
                severity=sev_data.get("severity", "Medium"),
                health_score=int(score),
                forest_loss_pct=float(sev_data.get("forest_loss", 0.0)),
                report_id=latest_report_id
            ))
        except Exception as e:
            print(f"Error reading severity.json: {e}")

    # For legacy history.json, we'll map them as dummy AnalysisHistoryRecords
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r') as f:
                history_data = json.load(f)
            
            for idx, item in enumerate(history_data):
                # Simple parsing logic for legacy logs
                title = item.get("title", "")
                detail = item.get("detail", "")
                
                # We only want to convert actual "Analysis Completed" logs to history records
                if "Analysis" in title or "run" in detail.lower():
                    # Generate a pseudo record
                    records.append(AnalysisHistoryRecord(
                        analysis_id=f"LEGACY_{idx}",
                        forest_name="Satpura Tiger Reserve",
                        date=item.get("date", "01 Jan 2026"),
                        time="00:00",
                        status="Completed",
                        severity="Low",
                        health_score=85,
                        forest_loss_pct=2.4,
                        report_id=None
                    ))
        except Exception as e:
            print(f"Error reading history.json: {e}")

    # Remove duplicates if legacy overlapped with current
    unique_records = {r.analysis_id: r for r in records}
    
    # Sort by date (descending string approximation since ID has timestamp)
    sorted_records = list(unique_records.values())
    sorted_records.sort(key=lambda x: x.analysis_id, reverse=True)
    return sorted_records

def get_latest_analysis() -> Optional[AnalysisHistoryRecord]:
    records = get_analysis_history()
    return records[0] if records else None

def get_analysis_by_id(analysis_id: str) -> Optional[AnalysisHistoryRecord]:
    records = get_analysis_history()
    for r in records:
        if r.analysis_id == analysis_id:
            return r
    return None
