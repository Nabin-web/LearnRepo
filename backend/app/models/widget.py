from pydantic import BaseModel
from typing import Optional

class WidgetConfig(BaseModel):
    videoUrl: str
    clickableLink: str

class WidgetResponse(BaseModel):
    videoUrl: str
    clickableLink: str
