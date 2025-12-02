import asyncio
import os
from app.database import db
from app.models.store import Store, Model3D, Position, Scale

async def seed_data():
    # Get domain from environment variable or use default
    # For production: learnrepo-1.onrender.com
    # For local: localhost
    domain = os.getenv("WIDGET_DOMAIN", "learnrepo-1.onrender.com")
    frontend_url = os.getenv("FRONTEND_URL", "https://learnrepo-1.onrender.com")
    print("Seeding data...")
    print("Clearing all existing data...")
    
    # Clear existing data from all collections
    stores_deleted = await db.stores.delete_many({})
    analytics_deleted = await db.analytics.delete_many({})
    print(f"  - Deleted {stores_deleted.deleted_count} stores")
    print(f"  - Deleted {analytics_deleted.deleted_count} analytics records")
    print()
    
    # NOTE: Replace the model URLs below with actual glTF/GLB URLs for shirt, pant, and shoe models
    # You can find free 3D models at: Sketchfab, Poly Haven, or create your own
    # Seed with two stores, the first with multiple models for the details page
    stores = [
        Store(
            _id="store_001",
            name="Fashion Store",
            backgroundImage="https://images.unsplash.com/photo-1719716133697-e924192e9a7f?q=80&w=2362&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            models=[
                Model3D(
                    id="shirt_1",
                    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb",
                    position=Position(x=0.3, y=0.65),
                    scale=Scale(width=300.0, height=300.0),
                ),
             
                
            Model3D(
                    id="pant_2",
                    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb",
                    position=Position(x=0.5, y=0.65),
                    scale=Scale(width=4000.0, height=4000.0),
                ),
                Model3D(
                    id="shoe_1",
                    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf",
                    position=Position(x=0.7, y=0.65),
                    scale=Scale(width=400.0, height=400.0),
                ),
            ],
            activeUsers=0,
        ),
        Store(
            _id="store_002",
            name="Clothing Boutique",
            backgroundImage="https://images.unsplash.com/photo-1551909386-707ddce67573?q=80&w=2338&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            models=[
                Model3D(
                    id="shoe_2",
                    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf",
                    position=Position(x=0.2, y=0.45),
                    scale=Scale(width=400.0, height=400.0),
                ),
                Model3D(
                    id="pant_2",
                    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb",
                    position=Position(x=0.4, y=0.45),
                    scale=Scale(width=4000.0, height=4000.0),
                ),
                
            ],
            activeUsers=0,
        ),
    ]
    
    for store in stores:
        await db.stores.insert_one(store.model_dump(by_alias=True))
        print(f"Inserted store: {store.name}")
    
    print(f"\nConfiguring widgets with domain: {domain}")
    print(f"Frontend URL: {frontend_url}\n")
        
    # Add widget config to store_001
    await db.stores.update_one(
        {"_id": "store_001"},
        {"$set": {
            "domain": domain,
            "widgetConfig": {
                "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                "clickableLink": f"{frontend_url}/store/store_001"
            }
        }}
    )
    print(f"✅ Updated store_001 with widget config (domain: {domain})")
    
    # Add widget config to store_002 (different video)
    await db.stores.update_one(
        {"_id": "store_002"},
        {"$set": {
            "domain": domain,  # Both stores use the same domain
            "widgetConfig": {
                "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
                "clickableLink": f"{frontend_url}/store/store_002"
            }
        }}
    )
    print(f"✅ Updated store_002 with widget config (domain: {domain})")

    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_data())
