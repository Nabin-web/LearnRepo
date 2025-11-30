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
