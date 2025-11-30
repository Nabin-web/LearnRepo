from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.MONGODB_URL, tlsAllowInvalidCertificates=True)
db = client[settings.DATABASE_NAME]
