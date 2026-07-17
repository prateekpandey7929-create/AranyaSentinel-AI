import json
import os
import uuid
from typing import List, Optional
from datetime import datetime
from .notification_models import Notification, NotificationType, NotificationPriority, NotificationStatus

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONFIG_DIR = os.path.join(BASE_DIR, 'config')
NOTIFICATIONS_FILE = os.path.join(CONFIG_DIR, 'notifications.json')

os.makedirs(CONFIG_DIR, exist_ok=True)

# Generate Temporary Data (Step 7) if file doesn't exist
if not os.path.exists(NOTIFICATIONS_FILE):
    dummy_data = [
        Notification(
            title="Analysis Completed",
            description="Forest health scan for Satpura region completed successfully. Severity: Low.",
            type=NotificationType.ANALYSIS,
            priority=NotificationPriority.MEDIUM,
            is_read=False
        ).dict(),
        Notification(
            title="Report Generated",
            description="Bilingual PDF Report generated for Satpura region.",
            type=NotificationType.REPORT,
            priority=NotificationPriority.LOW,
            is_read=True
        ).dict(),
        Notification(
            title="High Severity Detected",
            description="Warning: High localized canopy loss detected in western sector.",
            type=NotificationType.ALERT,
            priority=NotificationPriority.HIGH,
            is_read=False
        ).dict(),
        Notification(
            title="NDVI Updated",
            description="Latest Sentinel-2 imagery processed for vegetation indices.",
            type=NotificationType.SYSTEM,
            priority=NotificationPriority.LOW,
            is_read=True
        ).dict()
    ]
    # Convert datetime to string for JSON
    for d in dummy_data:
        d['timestamp'] = d['timestamp'].isoformat()
        
    with open(NOTIFICATIONS_FILE, 'w') as f:
        json.dump(dummy_data, f, indent=4)

def _read_db() -> List[dict]:
    try:
        with open(NOTIFICATIONS_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return []

def _write_db(data: List[dict]):
    with open(NOTIFICATIONS_FILE, 'w') as f:
        json.dump(data, f, indent=4)

def get_all_notifications() -> List[Notification]:
    data = _read_db()
    return [Notification(**item) for item in data]

def get_unread_notifications() -> List[Notification]:
    data = _read_db()
    return [Notification(**item) for item in data if not item.get("is_read", False)]

def mark_as_read(notif_id: str) -> Optional[Notification]:
    data = _read_db()
    updated = None
    for item in data:
        if item.get("id") == notif_id:
            item["is_read"] = True
            updated = item
            break
    if updated:
        _write_db(data)
        return Notification(**updated)
    return None

def mark_all_as_read() -> bool:
    data = _read_db()
    for item in data:
        item["is_read"] = True
    _write_db(data)
    return True

def delete_notification(notif_id: str) -> bool:
    data = _read_db()
    new_data = [item for item in data if item.get("id") != notif_id]
    if len(data) != len(new_data):
        _write_db(new_data)
        return True
    return False
