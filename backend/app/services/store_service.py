from typing import List, Optional
from app.database import db
from app.models.store import Store

class StoreService:
    @staticmethod
    async def get_all_stores() -> List[Store]:
        stores = []
        cursor = db.stores.find()
        async for document in cursor:
            stores.append(Store(**document))
        return stores

    @staticmethod
    async def get_store(store_id: str) -> Optional[Store]:
        document = await db.stores.find_one({"_id": store_id})
        if document:
            return Store(**document)
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
