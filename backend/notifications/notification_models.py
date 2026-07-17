from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime
import uuid

class NotificationType(str, Enum):
    ANALYSIS = "Analysis"
    REPORT = "Report"
    SYSTEM = "System"
    ALERT = "Alert"

class NotificationPriority(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"

class NotificationStatus(str, Enum):
    ACTIVE = "Active"
    ARCHIVED = "Archived"

class Notification(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique Notification ID")
    title: str = Field(..., min_length=3, max_length=100, description="Title of the notification")
    description: str = Field(..., min_length=5, max_length=500, description="Detailed description")
    type: NotificationType = Field(..., description="Category of the notification")
    priority: NotificationPriority = Field(default=NotificationPriority.LOW, description="Urgency level")
    timestamp: datetime = Field(default_factory=datetime.now, description="Time of creation")
    status: NotificationStatus = Field(default=NotificationStatus.ACTIVE, description="Active or Archived status")
    is_read: bool = Field(default=False, description="Read/Unread toggle")
    related_analysis_id: Optional[str] = Field(default=None, description="Linked Analysis ID if applicable")
    related_report_id: Optional[str] = Field(default=None, description="Linked Report ID if applicable")
    created_by: str = Field(default="System", description="Source of the notification")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Analysis Completed",
                "description": "Forest health scan for Satpura region has been completed.",
                "type": "Analysis",
                "priority": "Medium",
                "is_read": False,
                "created_by": "AI Core"
            }
        }

class AnalysisHistoryRecord(BaseModel):
    analysis_id: str = Field(..., description="Unique Analysis ID")
    forest_name: str = Field(..., description="Name of the analyzed forest region")
    date: str = Field(..., description="Date of analysis (e.g., '14 Jan 2026')")
    time: str = Field(..., description="Time of analysis (e.g., '14:30')")
    status: str = Field(default="Completed", description="Status of analysis")
    severity: str = Field(..., description="Calculated severity (High, Medium, Low)")
    health_score: int = Field(..., description="Forest health score (0-100)")
    forest_loss_pct: float = Field(..., description="Percentage of forest canopy lost")
    report_id: Optional[str] = Field(default=None, description="Linked Report ID")

