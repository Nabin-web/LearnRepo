from fastapi import APIRouter, HTTPException
from app.database import db
from app.models.widget import WidgetResponse

router = APIRouter(
    prefix="/api/widget",
    tags=["widget"]
)

@router.get("/config", response_model=WidgetResponse)
async def get_widget_config(domain: str):
    store = await db.stores.find_one({"domain": domain})
    if not store or "widgetConfig" not in store:
        raise HTTPException(status_code=404, detail="Widget configuration not found for this domain")
    
    config = store["widgetConfig"]
    return WidgetResponse(
        videoUrl=config["videoUrl"],
        clickableLink=config["clickableLink"]
    )
