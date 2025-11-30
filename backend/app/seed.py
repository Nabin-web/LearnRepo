import asyncio
from app.database import db
from app.models.store import Store, Model3D, Position, Scale

async def seed_data():
    print("Seeding data...")
    
    # Clear existing data
    await db.stores.delete_many({})
    
    # Seed with two stores, the first with multiple models for the details page
    stores = [
        Store(
            _id="store_001",
            name="Modern Living Room",
            backgroundImage="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2574&auto=format&fit=crop",
            models=[
                Model3D(
                    id="chair_1",
                    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb",
                    position=Position(x=0.2, y=0.55),
                    scale=Scale(width=600.0, height=600.0),  # 4x scale (150 * 4)
                ),
                Model3D(
                    id="table_1",
                    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb",
                    position=Position(x=0.5, y=0.55),
                    scale=Scale(width=8000.0, height=8000.0),  # 4x scale (2000 * 4)
                ),
                Model3D(
                    id="sofa_1",
                    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf",
                    position=Position(x=0.8, y=0.55),
                    scale=Scale(width=800.0, height=800.0),  # 4x scale (200 * 4)
                ),
            ],
            activeUsers=0,
        ),
        Store(
            _id="store_002",
            name="Cozy Bedroom",
            backgroundImage="https://cdn.shopify.com/s/files/1/0586/4266/1551/files/soft-girl-aesthetic-wall-decor-roomtery1_1024x1024.jpg?v=1675970618",
            models=[
               
                   Model3D(
                    id="sofa_1",
                    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/FlightHelmet/glTF/FlightHelmet.gltf",
                    position=Position(x=0.8, y=0.55),
                    scale=Scale(width=800.0, height=800.0),  # 4x scale (200 * 4)
                ),
                Model3D(
                    id="table_1",
                    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb",
                    position=Position(x=0.5, y=0.55),
                    scale=Scale(width=8000.0, height=8000.0),  # 4x scale (2000 * 4)
                ),
                  Model3D(
                    id="chair_1",
                    url="https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SheenChair/glTF-Binary/SheenChair.glb",
                    position=Position(x=0.2, y=0.55),
                    scale=Scale(width=600.0, height=600.0),  # 4x scale (150 * 4)
                ),
             
            ],
            activeUsers=0,
        ),
    ]
    
    for store in stores:
        await db.stores.insert_one(store.model_dump(by_alias=True))
        print(f"Inserted store: {store.name}")
        
    # Add extra widget config to the primary store (as before)
    await db.stores.update_one(
        {"_id": "store_001"},
        {"$set": {
            "domain": "localhost",
            "widgetConfig": {
                "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                "clickableLink": "http://localhost:3000/store/store_001"
            }
        }}
    )
    print("Updated store_001 with widget config")

    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_data())
