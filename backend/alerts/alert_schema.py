from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .alert_models import AlertStatus, AlertSeverity

class AlertBase(BaseModel):
    analysis_id: str
    forest_name: str
    forest_location: str
    forest_loss_percentage: float
    forest_health_score: float
    severity: AlertSeverity
    alert_type: str

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: int
    generated_date: str
    generated_time: str
    status: AlertStatus
    resolved_date: Optional[datetime] = None
    acknowledged_date: Optional[datetime] = None
    escalated_date: Optional[datetime] = None
    assigned_email: Optional[str] = None
    escalated_email: Optional[str] = None
    remarks: Optional[str] = None
    email_delivery_status: Optional[str] = None

    class Config:
        from_attributes = True

class AlertAcknowledgeRequest(BaseModel):
    remarks: Optional[str] = None
