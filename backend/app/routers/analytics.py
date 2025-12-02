from fastapi import APIRouter, HTTPException, Query
from app.database import db
from app.models.analytics import AnalyticsEvent, AnalyticsResponse, AnalyticsSummary
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"]
)

@router.post("/track", response_model=AnalyticsResponse)
async def track_event(event: AnalyticsEvent):
    """
    Track a widget analytics event.
    Events: widget_loaded, video_loaded, video_clicked
    """
    try:
        # Insert event into analytics collection
        await db.analytics.insert_one({
            "event": event.event,
            "storeId": event.storeId,
            "domain": event.domain,
            "userAgent": event.userAgent,
            "referrer": event.referrer,
            "timestamp": event.timestamp,
            "sessionId": event.sessionId
        })
        
        return AnalyticsResponse(
            success=True,
            message=f"Event '{event.event}' tracked successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track event: {str(e)}")

@router.get("/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    storeId: Optional[str] = Query(None, description="Filter by store ID"),
    domain: Optional[str] = Query(None, description="Filter by domain"),
    days: int = Query(7, description="Number of days to look back")
):
    """
    Get analytics summary for a store or domain.
    """
    # Build filter
    filter_query = {
        "timestamp": {
            "$gte": datetime.utcnow() - timedelta(days=days)
        }
    }
    
    if storeId:
        filter_query["storeId"] = storeId
    if domain:
        filter_query["domain"] = domain
    
    # Fetch events
    events = await db.analytics.find(filter_query).sort("timestamp", -1).to_list(10000)
    
    # Calculate metrics
    widget_loads = sum(1 for e in events if e["event"] == "widget_loaded")
    video_loads = sum(1 for e in events if e["event"] == "video_loaded")
    video_clicks = sum(1 for e in events if e["event"] == "video_clicked")
    
    # Calculate conversion rate (clicks / widget loads)
    conversion_rate = (video_clicks / widget_loads * 100) if widget_loads > 0 else 0
    
    # Count unique domains
    unique_domains = len(set(e["domain"] for e in events if e.get("domain")))
    
    return AnalyticsSummary(
        total_widget_loads=widget_loads,
        total_video_loads=video_loads,
        total_video_clicks=video_clicks,
        conversion_rate=round(conversion_rate, 2),
        unique_domains=unique_domains,
        events=[
            {
                "event": e["event"],
                "domain": e.get("domain"),
                "timestamp": e["timestamp"].isoformat() if isinstance(e["timestamp"], datetime) else e["timestamp"]
            }
            for e in events[:100]  # Return last 100 events
        ]
    )

@router.get("/events")
async def get_events(
    storeId: Optional[str] = Query(None),
    domain: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    limit: int = Query(100, le=1000),
    skip: int = Query(0)
):
    """
    Get raw analytics events with pagination.
    """
    filter_query = {}
    
    if storeId:
        filter_query["storeId"] = storeId
    if domain:
        filter_query["domain"] = domain
    if event_type:
        filter_query["event"] = event_type
    
    events = await db.analytics.find(filter_query).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
    
    # Convert datetime to string for JSON serialization
    for event in events:
        if isinstance(event.get("timestamp"), datetime):
            event["timestamp"] = event["timestamp"].isoformat()
        if "_id" in event:
            event["_id"] = str(event["_id"])
    
    return {
        "events": events,
        "count": len(events),
        "skip": skip,
        "limit": limit
    }

@router.delete("/clear")
async def clear_analytics(
    storeId: Optional[str] = Query(None),
    confirm: bool = Query(False, description="Must be true to confirm deletion")
):
    """
    Clear analytics data. Use with caution.
    """
    if not confirm:
        raise HTTPException(status_code=400, detail="Must confirm deletion by setting confirm=true")
    
    filter_query = {}
    if storeId:
        filter_query["storeId"] = storeId
    
    result = await db.analytics.delete_many(filter_query)
    
    return {
        "success": True,
        "deleted_count": result.deleted_count,
        "message": f"Deleted {result.deleted_count} analytics events"
    }

