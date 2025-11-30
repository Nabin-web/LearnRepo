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
    try:
        # Convert position to dict for MongoDB
        position_dict = request.position.model_dump()
        
        result = await db.stores.update_one(
            {"_id": store_id, "models.id": model_id},
            {"$set": {"models.$.position": position_dict}}
        )
        
        # Check matched_count to see if store/model was found
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404, 
                detail=f"Store '{store_id}' or model '{model_id}' not found"
            )
        
        # Return success even if modified_count is 0 (position was already the same)
        return {"success": True, "position": request.position}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update model position: {str(e)}"
        )
