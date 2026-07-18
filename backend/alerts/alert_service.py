import os
import datetime
from sqlalchemy.orm import Session
from .alert_models import Alert, AlertStatus, AlertSeverity
from .alert_schema import AlertCreate
from .email_service import send_alert_email
import logging

logger = logging.getLogger("backend.alert_service")

# Threshold Mapping
SEVERITY_LEVELS = {
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
    "CRITICAL": 4
}

def create_alert(db: Session, alert_data: AlertCreate):
    """
    Creates an alert in the database.
    If the severity meets the threshold, it also triggers the email dispatch.
    """
    # 1. Check Threshold
    configured_threshold_str = os.environ.get("ALERT_THRESHOLD", "High").upper()
    configured_threshold_val = SEVERITY_LEVELS.get(configured_threshold_str, 3)
    
    current_severity_val = SEVERITY_LEVELS.get(alert_data.severity.value.upper(), 1)
    
    if current_severity_val < configured_threshold_val:
        logger.info(f"Alert ignored. Severity {alert_data.severity.value} is below threshold {configured_threshold_str}")
        return None

    # 2. Create DB Record
    now = datetime.datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")
    
    ranger_email = os.environ.get("LOCAL_RANGER_EMAIL", "")

    db_alert = Alert(
        analysis_id=alert_data.analysis_id,
        forest_name=alert_data.forest_name,
        forest_location=alert_data.forest_location,
        forest_loss_percentage=alert_data.forest_loss_percentage,
        forest_health_score=alert_data.forest_health_score,
        severity=alert_data.severity,
        alert_type=alert_data.alert_type,
        generated_date=date_str,
        generated_time=time_str,
        status=AlertStatus.PENDING,
        assigned_email=ranger_email,
        email_delivery_status="Pending"
    )
    
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    
    logger.info(f"Alert #{db_alert.id} created successfully.")
    
    # 3. Send Email
    subject = f"[AranyaSentinel AI] Forest Monitoring Alert - {db_alert.severity.value}"
    alert_dict = {
        "severity": db_alert.severity.value,
        "alert_type": db_alert.alert_type,
        "forest_name": db_alert.forest_name,
        "generated_date": f"{db_alert.generated_date} {db_alert.generated_time}",
        "forest_loss_percentage": db_alert.forest_loss_percentage,
        "forest_health_score": db_alert.forest_health_score,
        "forest_location": db_alert.forest_location
    }
    
    email_status = send_alert_email(to_email=ranger_email, subject=subject, alert_data=alert_dict, is_escalation=False)
    
    # 4. Update Email Status in DB
    db_alert.email_delivery_status = email_status
    db.commit()
    db.refresh(db_alert)
    
    return db_alert
