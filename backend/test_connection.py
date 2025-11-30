import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def test_connection():
    print(f"Testing connection to: {settings.MONGODB_URL[:50]}...")
    try:
        client = AsyncIOMotorClient(
            settings.MONGODB_URL, 
            serverSelectionTimeoutMS=5000,
            tlsAllowInvalidCertificates=True
        )
        # Test the connection
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB!")
        
        # List databases
        db_list = await client.list_database_names()
        print(f"Available databases: {db_list}")
        
        client.close()
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\nPlease check:")
        print("1. Your MongoDB password is correct in .env")
        print("2. Your IP address is whitelisted in MongoDB Atlas")
        print("3. The connection string is correct")

if __name__ == "__main__":
    asyncio.run(test_connection())
