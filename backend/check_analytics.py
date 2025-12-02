"""
Script to check analytics events from the widget.
This script queries MongoDB to show all tracked analytics events.
"""

import asyncio
from datetime import datetime, timedelta
from app.database import db
from collections import Counter


async def check_analytics():
    """Display analytics events from the widget."""
    
    print("=" * 60)
    print("Widget Analytics Events")
    print("=" * 60)
    print()
    
    try:
        # Count total events
        total_events = await db.analytics.count_documents({})
        print(f"📊 Total Analytics Events: {total_events}")
        print()
        
        if total_events == 0:
            print("⚠️  No analytics events found yet.")
            print()
            print("To generate events:")
            print("1. Make sure backend is running")
            print("2. Open your frontend in a browser")
            print("3. The widget should automatically send events")
            print("4. Click the video banner to generate 'banner_clicked' event")
            return
        
        # Count events by type
        print("📈 Events by Type:")
        print("-" * 60)
        
        pipeline = [
            {
                "$group": {
                    "_id": "$event",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            }
        ]
        
        event_counts = await db.analytics.aggregate(pipeline).to_list(length=10)
        
        for item in event_counts:
            event_name = item["_id"]
            count = item["count"]
            status = "✅" if event_name in ["widget_loaded", "video_loaded", "banner_clicked"] else "ℹ️"
            print(f"  {status} {event_name}: {count}")
        
        print()
        
        # Check for the three required events
        required_events = ["widget_loaded", "video_loaded", "banner_clicked"]
        print("✅ Required Events Check:")
        print("-" * 60)
        
        for event in required_events:
            count = await db.analytics.count_documents({"event": event})
            status = "✅" if count > 0 else "❌"
            print(f"  {status} {event}: {count} event(s)")
        
        print()
        
        # Show recent events (last 10)
        print("📋 Recent Events (Last 10):")
        print("-" * 60)
        
        recent_events = await db.analytics.find().sort("timestamp", -1).limit(10).to_list(length=10)
        
        for event in recent_events:
            event_type = event.get("event", "unknown")
            domain = event.get("domain", "unknown")
            timestamp = event.get("timestamp", "unknown")
            
            # Format timestamp
            if isinstance(timestamp, datetime):
                timestamp_str = timestamp.strftime("%Y-%m-%d %H:%M:%S")
            else:
                timestamp_str = str(timestamp)
            
            print(f"  • {event_type} | Domain: {domain} | Time: {timestamp_str}")
        
        print()
        
        # Events by domain
        print("🌐 Events by Domain:")
        print("-" * 60)
        
        domain_pipeline = [
            {
                "$group": {
                    "_id": "$domain",
                    "total": {"$sum": 1},
                    "events": {
                        "$push": "$event"
                    }
                }
            },
            {
                "$sort": {"total": -1}
            }
        ]
        
        domain_stats = await db.analytics.aggregate(domain_pipeline).to_list(length=10)
        
        for item in domain_stats:
            domain = item["_id"]
            total = item["total"]
            events = item["events"]
            event_counter = Counter(events)
            
            print(f"  {domain}:")
            print(f"    Total: {total} events")
            for event_name, count in event_counter.items():
                print(f"      - {event_name}: {count}")
        
        print()
        
        # Summary
        widget_loaded = await db.analytics.count_documents({"event": "widget_loaded"})
        video_loaded = await db.analytics.count_documents({"event": "video_loaded"})
        banner_clicked = await db.analytics.count_documents({"event": "banner_clicked"})
        
        print("=" * 60)
        print("Summary")
        print("=" * 60)
        print(f"✅ Widget Loaded: {widget_loaded} event(s)")
        print(f"✅ Video Loaded: {video_loaded} event(s)")
        print(f"✅ Banner Clicked: {banner_clicked} event(s)")
        print()
        
        if widget_loaded > 0 and video_loaded > 0 and banner_clicked > 0:
            print("🎉 All three required events are being tracked!")
        else:
            print("⚠️  Some events are missing. Make sure to:")
            if widget_loaded == 0:
                print("   - Load a page with the widget (widget_loaded)")
            if video_loaded == 0:
                print("   - Wait for video to load (video_loaded)")
            if banner_clicked == 0:
                print("   - Click the video banner (banner_clicked)")
        
    except Exception as e:
        print(f"❌ Error checking analytics: {e}")
        print("\nPlease check:")
        print("1. MongoDB is running and connected")
        print("2. Database name is correct in .env")
        print("3. Analytics collection exists")


if __name__ == "__main__":
    asyncio.run(check_analytics())

