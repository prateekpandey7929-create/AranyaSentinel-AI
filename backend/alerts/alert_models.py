from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text, Boolean
import enum
import datetime
from .database import Base

class AlertStatus(str, enum.Enum):
    PENDING = "Pending"
    ACKNOWLEDGED = "Acknowledged"
    RESOLVED = "Resolved"
    ESCALATED = "Escalated"

class AlertSeverity(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(String, index=True, nullable=True) # UUID for tracking the analysis
    
    forest_name = Column(String, nullable=True)
    forest_location = Column(String, nullable=True)
    forest_loss_percentage = Column(Float, nullable=True)
    forest_health_score = Column(Float, nullable=True)
    
    severity = Column(Enum(AlertSeverity), nullable=False)
    alert_type = Column(String, nullable=False) # e.g. "High Forest Loss", "Illegal Construction"
    
    generated_date = Column(String, nullable=False)
    generated_time = Column(String, nullable=False)
    
    status = Column(Enum(AlertStatus), default=AlertStatus.PENDING, nullable=False)
    
    resolved_date = Column(DateTime, nullable=True)
    acknowledged_date = Column(DateTime, nullable=True)
    escalated_date = Column(DateTime, nullable=True)
    
    assigned_email = Column(String, nullable=True)
    escalated_email = Column(String, nullable=True)
    
    reminder_sent = Column(Boolean, default=False)
    
    remarks = Column(Text, nullable=True)
    email_delivery_status = Column(String, nullable=True) # e.g. "Sent", "Failed"
