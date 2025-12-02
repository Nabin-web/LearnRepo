"""
Script to add or update widget configuration for a specific store.
"""

import asyncio
from app.database import db


async def add_store_widget(store_id: str, video_url: str, clickable_link: str, domain: str = "localhost"):
    """
    Add or update widget configuration for a store.
    
    Args:
        store_id: The store ID (e.g., "store_002")
        video_url: URL to the video file
        clickable_link: URL to open when banner is clicked
        domain: Domain name (default: "localhost")
    """
    try:
        # Check if store exists
        store = await db.stores.find_one({"_id": store_id})
        if not store:
            print(f"❌ Store '{store_id}' not found!")
            print("\nAvailable stores:")
            stores = await db.stores.find({}, {"_id": 1, "name": 1}).to_list(length=10)
            for s in stores:
                print(f"  - {s.get('_id')}: {s.get('name', 'N/A')}")
            return False
        
        # Update store with widget config
        result = await db.stores.update_one(
            {"_id": store_id},
            {"$set": {
                "domain": domain,
                "widgetConfig": {
                    "videoUrl": video_url,
                    "clickableLink": clickable_link
                }
            }}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            print(f"✅ Widget configuration updated for store: {store_id}")
            print(f"   Video URL: {video_url}")
            print(f"   Clickable Link: {clickable_link}")
            print(f"   Domain: {domain}")
            return True
        else:
            print(f"⚠️  Store found but no changes made")
            return False
            
    except Exception as e:
        print(f"❌ Error updating widget config: {e}")
        return False


async def main():
    """Main function with example usage."""
    import sys
    
    if len(sys.argv) >= 4:
        # Command line arguments
        store_id = sys.argv[1]
        video_url = sys.argv[2]
        clickable_link = sys.argv[3]
        domain = sys.argv[4] if len(sys.argv) > 4 else "localhost"
        
        await add_store_widget(store_id, video_url, clickable_link, domain)
    else:
        # Interactive mode or example
        print("=" * 60)
        print("Add Widget Configuration to Store")
        print("=" * 60)
        print()
        print("Usage:")
        print("  python add_store_widget.py <store_id> <video_url> <clickable_link> [domain]")
        print()
        print("Example:")
        print('  python add_store_widget.py store_002 \\')
        print('    "https://example.com/video.mp4" \\')
        print('    "http://localhost:3000/store/store_002" \\')
        print('    "localhost"')
        print()
        print("Or run this script to add widget to store_002:")
        print()
        
        # Add widget to store_002
        await add_store_widget(
            store_id="store_002",
            video_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            clickable_link="http://localhost:3000/store/store_002",
            domain="localhost"
        )


if __name__ == "__main__":
    asyncio.run(main())


