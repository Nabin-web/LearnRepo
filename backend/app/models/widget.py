from pydantic import BaseModel
from typing import Optional, Dict, Any

class WidgetConfig(BaseModel):
    videoUrl: str
    clickableLink: str

class WidgetResponse(BaseModel):
    videoUrl: str
    clickableLink: str

class AnalyticsEvent(BaseModel):
    event: str  # widget_loaded, video_loaded, banner_clicked
    domain: str
    timestamp: Optional[str] = None
    userAgent: Optional[str] = None
    referrer: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
