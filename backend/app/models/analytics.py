from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class AnalyticsEvent(BaseModel):
    event: str = Field(..., description="Event name: widget_loaded, video_loaded, video_clicked")
    storeId: Optional[str] = Field(None, description="Store ID if provided")
    domain: str = Field(..., description="Domain where widget is embedded")
    userAgent: Optional[str] = Field(None, description="User agent string")
    referrer: Optional[str] = Field(None, description="Referrer URL")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Event timestamp")
    sessionId: Optional[str] = Field(None, description="Session identifier")

class AnalyticsResponse(BaseModel):
    success: bool
    message: str

class AnalyticsSummary(BaseModel):
    total_widget_loads: int
    total_video_loads: int
    total_video_clicks: int
    conversion_rate: float  # clicks / loads
    unique_domains: int
    events: list

