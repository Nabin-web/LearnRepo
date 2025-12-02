"""
Script to insert a store with widget configuration into MongoDB.
Run this script to add a store for widget testing.
"""

import asyncio
from app.database import db


async def insert_widget_store():
    """Insert a store document with widget configuration."""
    
    store_document = {
        "domain": "localhost",
        "name": "Test Store",
        "widgetConfig": {
            "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "clickableLink": "https://example.com"
        },
        "activeUsers": 0
    }
    
    try:
        # Check if store with this domain already exists
        existing = await db.stores.find_one({"domain": "localhost"})
        if existing:
            print("⚠️  Store with domain 'localhost' already exists!")
            print(f"   Existing store ID: {existing.get('_id')}")
            response = input("   Do you want to update it? (y/n): ")
            if response.lower() == 'y':
                result = await db.stores.update_one(
                    {"domain": "localhost"},
                    {"$set": store_document}
                )
                if result.modified_count > 0:
                    print("✅ Store updated successfully!")
                else:
                    print("ℹ️  Store document unchanged (no modifications needed)")
            else:
                print("❌ Operation cancelled.")
            return
        
        # Insert new store
        result = await db.stores.insert_one(store_document)
        print(f"✅ Store inserted successfully!")
        print(f"   Store ID: {result.inserted_id}")
        print(f"   Domain: {store_document['domain']}")
        print(f"   Video URL: {store_document['widgetConfig']['videoUrl']}")
        print(f"   Clickable Link: {store_document['widgetConfig']['clickableLink']}")
        
    except Exception as e:
        print(f"❌ Error inserting store: {e}")
        print("\nPlease check:")
        print("1. MongoDB is running")
        print("2. MongoDB connection string in .env is correct")
        print("3. Database name is correct")


if __name__ == "__main__":
    print("Inserting widget store into MongoDB...")
    print("-" * 50)
    asyncio.run(insert_widget_store())

