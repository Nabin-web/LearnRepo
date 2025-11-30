from fastapi import APIRouter, HTTPException
from typing import List
from app.models.store import Store
from app.services.store_service import StoreService

router = APIRouter(
    prefix="/api/stores",
    tags=["stores"]
)

@router.get("/", response_model=List[Store])
async def get_stores():
    return await StoreService.get_all_stores()

@router.get("/{store_id}", response_model=Store)
async def get_store(store_id: str):
    store = await StoreService.get_store(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store
