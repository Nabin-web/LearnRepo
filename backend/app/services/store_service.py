from typing import List, Optional
from app.database import db
from app.models.store import Store
from pydantic import ValidationError
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

class StoreService:
    @staticmethod
    async def get_all_stores() -> List[Store]:
        stores = []
        cursor = db.stores.find()
        async for document in cursor:
            try:
                # Convert MongoDB ObjectId to string if needed
                if "_id" in document and isinstance(document["_id"], ObjectId):
                    document["_id"] = str(document["_id"])
                stores.append(Store(**document))
            except ValidationError as e:
                doc_id = str(document.get("_id", "unknown")) if "_id" in document else "unknown"
                logger.warning(f"Skipping invalid store document: {doc_id}. Error: {e}")
                continue
        return stores

    @staticmethod
    async def get_store(store_id: str) -> Optional[Store]:
        document = await db.stores.find_one({"_id": store_id})
        if document:
            try:
                # Convert MongoDB ObjectId to string if needed
                if "_id" in document and isinstance(document["_id"], ObjectId):
                    document["_id"] = str(document["_id"])
                return Store(**document)
            except ValidationError as e:
                logger.error(f"Invalid store document for ID {store_id}: {e}")
                return None
        return None

    @staticmethod
    async def create_store(store: Store) -> Store:
        await db.stores.insert_one(store.model_dump(by_alias=True))
        return store

    @staticmethod
    async def update_active_users(store_id: str, active_users: int) -> bool:
        """Update the activeUsers count for a store"""
        print(f"[update_active_users] Updating store_id={store_id} with active_users={active_users}")
        
        result = await db.stores.update_one(
            {"_id": store_id},
            {"$set": {"activeUsers": active_users}}
        )
        
        print(f"[update_active_users] matched_count={result.matched_count}, modified_count={result.modified_count}")
        
        # Return True if document was found (matched), not just if it was modified
        # modified_count can be 0 if the value was already the same
        return result.matched_count > 0
