from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import List
import datetime

from .database import get_db
from .alert_models import Alert, AlertStatus
from .alert_schema import AlertResponse, AlertAcknowledgeRequest

router = APIRouter(prefix="/alerts", tags=["Smart Alerts"])

@router.get("/", response_model=List[AlertResponse])
def get_alerts(status_filter: str = None, db: Session = Depends(get_db)):
    query = db.query(Alert)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    return query.order_by(Alert.id.desc()).all()

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.post("/acknowledge/{alert_id}", response_model=AlertResponse)
def acknowledge_alert(alert_id: int, req: AlertAcknowledgeRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if alert.status in [AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED]:
        raise HTTPException(status_code=400, detail="Alert already acknowledged or resolved")
        
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_date = datetime.datetime.now()
    if req.remarks:
        alert.remarks = req.remarks
        
    db.commit()
    db.refresh(alert)
    return alert

@router.get("/email-acknowledge/{alert_id}", response_class=HTMLResponse)
def email_acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        return "<h1>Alert Not Found</h1><p>This alert does not exist or has been deleted.</p>"
    
    if alert.status in [AlertStatus.ACKNOWLEDGED, AlertStatus.RESOLVED]:
        return f"<h1>Already Processed</h1><p>Alert #{alert.id} has already been acknowledged or resolved.</p>"
        
    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_date = datetime.datetime.now()
    alert.remarks = "Acknowledged directly via Email Action Button."
        
    db.commit()
    return f"""
    <html>
        <body style="font-family: Arial; text-align: center; padding: 50px; background-color: #f0fdf4;">
            <h1 style="color: #166534;">Success! ✅</h1>
            <p style="font-size: 18px; color: #15803d;">Alert #{alert.id} for {alert.forest_name} has been successfully acknowledged.</p>
            <p>The escalation timer has been stopped. You can now close this tab.</p>
        </body>
    </html>
    """

@router.post("/resolve/{alert_id}", response_model=AlertResponse)
def resolve_alert(alert_id: int, req: AlertAcknowledgeRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.status = AlertStatus.RESOLVED
    alert.resolved_date = datetime.datetime.now()
    if req.remarks:
        alert.remarks = req.remarks
        
    db.commit()
    db.refresh(alert)
    return alert
