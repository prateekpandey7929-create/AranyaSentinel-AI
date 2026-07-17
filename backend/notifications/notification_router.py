from fastapi import APIRouter, HTTPException, status
from typing import List
from .notification_models import Notification, AnalysisHistoryRecord
from .notification_service import (
    get_all_notifications,
    get_unread_notifications,
    mark_as_read,
    mark_all_as_read,
    delete_notification
)
from .history_service import (
    get_analysis_history,
    get_latest_analysis,
    get_analysis_by_id
)

router = APIRouter()

# --- Notifications Endpoints ---

@router.get("/notifications", response_model=List[Notification], status_code=status.HTTP_200_OK)
def get_notifications():
    """Returns all notifications."""
    return get_all_notifications()

@router.get("/notifications/unread", response_model=List[Notification], status_code=status.HTTP_200_OK)
def get_unread():
    """Returns unread notifications."""
    return get_unread_notifications()

@router.post("/notifications/read/all", status_code=status.HTTP_200_OK)
def mark_all_read():
    """Marks all notifications as read."""
    success = mark_all_as_read()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to mark all as read.")
    return {"status": "success", "message": "All marked as read"}

@router.post("/notifications/read/{notif_id}", response_model=Notification, status_code=status.HTTP_200_OK)
def mark_read(notif_id: str):
    """Marks a specific notification as read."""
    notif = mark_as_read(notif_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif

@router.delete("/notifications/{notif_id}", status_code=status.HTTP_200_OK)
def delete_notif(notif_id: str):
    """Deletes a notification."""
    success = delete_notification(notif_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success", "message": "Notification deleted"}

# --- History Endpoints ---

@router.get("/history", response_model=List[AnalysisHistoryRecord], status_code=status.HTTP_200_OK)
def get_history():
    """Returns full analysis history."""
    return get_analysis_history()

@router.get("/history/latest", response_model=AnalysisHistoryRecord, status_code=status.HTTP_200_OK)
def get_latest():
    """Returns latest analysis."""
    rec = get_latest_analysis()
    if not rec:
        raise HTTPException(status_code=404, detail="No analysis found")
    return rec

@router.get("/history/{analysis_id}", response_model=AnalysisHistoryRecord, status_code=status.HTTP_200_OK)
def get_analysis_detail(analysis_id: str):
    """Returns details for a specific analysis."""
    rec = get_analysis_by_id(analysis_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return rec
