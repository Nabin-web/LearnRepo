from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import db
from app.models.store import Position

router = APIRouter(
    prefix="/api/stores",
    tags=["models"]
)

class UpdatePositionRequest(BaseModel):
    position: Position

@router.patch("/{store_id}/models/{model_id}")
async def update_model_position(store_id: str, model_id: str, request: UpdatePositionRequest):
    result = await db.stores.update_one(
        {"_id": store_id, "models.id": model_id},
        {"$set": {"models.$.position": request.position.model_dump()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Store or model not found")
    
    return {"success": True, "position": request.position}
