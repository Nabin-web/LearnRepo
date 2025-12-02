"""
Script to insert a store with widget configuration into MongoDB.
Run this script to add a store for widget testing.

Usage:
    python insert_widget_store.py                    # Uses 'localhost' (default)
    python insert_widget_store.py --domain example.com
    python insert_widget_store.py -d your-app.vercel.app
"""

import asyncio
import sys
import argparse
from app.database import db


async def insert_widget_store(domain: str, video_url: str = None, clickable_link: str = None, update_existing: bool = False):
    """
    Insert a store document with widget configuration.
    
    Args:
        domain: The domain where the widget will be embedded (e.g., 'localhost', 'your-app.vercel.app')
        video_url: Optional video URL (defaults to sample video)
        clickable_link: Optional clickable link (defaults to example.com)
        update_existing: If True, automatically update existing store without prompting
    """
    
    # Default values
    default_video_url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    default_clickable_link = "https://example.com"
    
    store_document = {
        "domain": domain,
        "name": f"Store for {domain}",
        "widgetConfig": {
            "videoUrl": video_url or default_video_url,
            "clickableLink": clickable_link or default_clickable_link
        },
        "activeUsers": 0
    }
    
    try:
        # Check if store with this domain already exists
        existing = await db.stores.find_one({"domain": domain})
        if existing:
            print(f"⚠️  Store with domain '{domain}' already exists!")
            print(f"   Existing store ID: {existing.get('_id')}")
            
            if update_existing:
                # Non-interactive mode: automatically update
                print("   Auto-updating existing store (--update flag set)...")
                result = await db.stores.update_one(
                    {"domain": domain},
                    {"$set": store_document}
                )
                if result.modified_count > 0:
                    print("✅ Store updated successfully!")
                else:
                    print("ℹ️  Store document unchanged (no modifications needed)")
                return
            else:
                # Interactive mode: prompt user
                response = input("   Do you want to update it? (y/n): ")
                if response.lower() == 'y':
                    result = await db.stores.update_one(
                        {"domain": domain},
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
        print(f"\n💡 The widget will now work on: {domain}")
        
    except Exception as e:
        print(f"❌ Error inserting store: {e}")
        print("\nPlease check:")
        print("1. MongoDB is running")
        print("2. MongoDB connection string in .env is correct")
        print("3. Database name is correct")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Insert a store with widget configuration into MongoDB",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python insert_widget_store.py
  python insert_widget_store.py --domain example.com
  python insert_widget_store.py -d your-app.vercel.app
  python insert_widget_store.py -d example.com --video-url https://example.com/video.mp4 --clickable-link https://example.com/promo
        """
    )
    parser.add_argument(
        "-d", "--domain",
        default="localhost",
        help="Domain where the widget will be embedded (default: localhost)"
    )
    parser.add_argument(
        "--video-url",
        help="URL to the video file (default: sample video)"
    )
    parser.add_argument(
        "--clickable-link",
        help="URL to open when user clicks the banner (default: https://example.com)"
    )
    parser.add_argument(
        "--update",
        action="store_true",
        help="Automatically update existing store without prompting (useful for Docker/non-interactive mode)"
    )
    
    args = parser.parse_args()
    
    print("Inserting widget store into MongoDB...")
    print("-" * 50)
    print(f"Domain: {args.domain}")
    if args.video_url:
        print(f"Video URL: {args.video_url}")
    if args.clickable_link:
        print(f"Clickable Link: {args.clickable_link}")
    print("-" * 50)
    
    asyncio.run(insert_widget_store(args.domain, args.video_url, args.clickable_link, args.update))

