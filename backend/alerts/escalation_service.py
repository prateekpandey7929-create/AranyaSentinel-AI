import os
import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal
from .alert_models import Alert, AlertStatus
from .email_service import send_alert_email
import logging

logger = logging.getLogger("backend.escalation_service")

def check_and_escalate_alerts():
    """
    Checks all pending alerts. If they exceed the escalation timeout,
    they are automatically escalated to the higher authority.
    """
    db: Session = SessionLocal()
    try:
        escalation_minutes = float(os.environ.get("ESCALATION_MINUTES", "5"))
        now = datetime.datetime.now()
        
        # Get all Pending alerts
        pending_alerts = db.query(Alert).filter(Alert.status == AlertStatus.PENDING).all()
        
        escalated_count = 0
        for alert in pending_alerts:
            # Parse generation time
            # Format: generated_date = "YYYY-MM-DD", generated_time = "HH:MM:SS"
            dt_str = f"{alert.generated_date} {alert.generated_time}"
            try:
                gen_dt = datetime.datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
            except Exception as e:
                logger.error(f"Error parsing date for alert {alert.id}: {e}")
                continue
                
            delta = now - gen_dt
            
            logger.info(f"Checking Alert #{alert.id} - Delta: {delta.total_seconds()}s, ReminderSent: {alert.reminder_sent}")
            
            # 1. Escalation Threshold
            if delta.total_seconds() > (escalation_minutes * 60):
                logger.info(f"Alert #{alert.id} breached escalation threshold. Escalating...")
                higher_auth_email = os.environ.get("HIGHER_AUTHORITY_EMAIL", "")
                if not higher_auth_email:
                    continue
                    
                subject = f"[ESCALATION] CRITICAL: Unresolved Forest Alert #{alert.id}"
                alert_dict = {
                    "id": alert.id,
                    "severity": alert.severity.value,
                    "alert_type": alert.alert_type,
                    "forest_name": alert.forest_name,
                    "generated_date": dt_str,
                    "forest_loss_percentage": alert.forest_loss_percentage,
                    "forest_health_score": alert.forest_health_score,
                    "forest_location": alert.forest_location
                }
                
                email_status = send_alert_email(to_email=higher_auth_email, subject=subject, alert_data=alert_dict, is_escalation=True)
                
                alert.status = AlertStatus.ESCALATED
                alert.escalated_date = now
                alert.escalated_email = higher_auth_email
                alert.email_delivery_status = f"Escalated ({email_status})"
                
                db.commit()
                escalated_count += 1
                
            # 2. Reminder Threshold (Halfway)
            elif delta.total_seconds() > (escalation_minutes * 30) and not alert.reminder_sent:
                logger.info(f"Alert #{alert.id} reached reminder threshold. Sending reminder to Ranger...")
                
                subject = f"[REMINDER] Action Required: Forest Alert #{alert.id}"
                alert_dict = {
                    "id": alert.id,
                    "severity": alert.severity.value,
                    "alert_type": alert.alert_type,
                    "forest_name": alert.forest_name,
                    "generated_date": dt_str,
                    "forest_loss_percentage": alert.forest_loss_percentage,
                    "forest_health_score": alert.forest_health_score,
                    "forest_location": alert.forest_location
                }
                
                email_status = send_alert_email(to_email=alert.assigned_email, subject=subject, alert_data=alert_dict, is_reminder=True)
                
                alert.reminder_sent = True
                alert.email_delivery_status = f"Reminder Sent ({email_status})"
                
                db.commit()
                
        if escalated_count > 0:
            logger.info(f"Successfully escalated {escalated_count} alerts.")
            
    except Exception as e:
        logger.error(f"Error during escalation check: {e}")
    finally:
        db.close()
