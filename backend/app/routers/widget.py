from fastapi import APIRouter, HTTPException, Request
from app.database import db
from app.models.widget import WidgetResponse, AnalyticsEvent
from typing import Optional
from datetime import datetime

router = APIRouter(
    prefix="/api/widget",
    tags=["widget"]
)

@router.get("/config", response_model=WidgetResponse)
async def get_widget_config(domain: str, store_id: Optional[str] = None):
    """
    Get widget configuration for a given domain or store ID.
    
    Supports two lookup methods:
    1. Store-based: If store_id is provided, looks up by store ID
    2. Domain-based: If no store_id, looks up by domain name
    
    Args:
        domain: The domain name where the widget is running
        store_id: Optional store ID for store-specific widget
        
    Returns:
        WidgetResponse with videoUrl and clickableLink
        
    Raises:
        HTTPException 404: If no store found or widget config missing
    """
    store = None
    
    # Priority 1: Store-based lookup (if store_id provided)
    if store_id:
        store = await db.stores.find_one({"_id": store_id})
        if not store:
            raise HTTPException(
                status_code=404,
                detail=f"Store not found: {store_id}"
            )
    else:
        # Priority 2: Domain-based lookup
        # Normalize domain (remove protocol, www, trailing slashes)
        normalized_domain = domain.lower().strip()
        if normalized_domain.startswith('http://') or normalized_domain.startswith('https://'):
            from urllib.parse import urlparse
            parsed = urlparse(normalized_domain)
            normalized_domain = parsed.netloc or parsed.path
        
        # Remove www. prefix if present
        if normalized_domain.startswith('www.'):
            normalized_domain = normalized_domain[4:]
        
        # Try exact match first
        store = await db.stores.find_one({"domain": normalized_domain})
        
        # If not found, try with www. prefix
        if not store:
            store = await db.stores.find_one({"domain": f"www.{normalized_domain}"})
        
        # If still not found, try without www. if we had it
        if not store and normalized_domain.startswith('www.'):
            store = await db.stores.find_one({"domain": normalized_domain[4:]})
        
        if not store:
            raise HTTPException(
                status_code=404, 
                detail=f"Widget configuration not found for domain: {domain}"
            )
    
    # Check if widget config exists
    if "widgetConfig" not in store:
        identifier = store_id if store_id else domain
        raise HTTPException(
            status_code=404,
            detail=f"Widget configuration missing for: {identifier}"
        )
    
    config = store["widgetConfig"]
    
    # Validate required fields
    if not config.get("videoUrl") or not config.get("clickableLink"):
        raise HTTPException(
            status_code=500,
            detail="Widget configuration is incomplete: missing videoUrl or clickableLink"
        )
    
    return WidgetResponse(
        videoUrl=config["videoUrl"],
        clickableLink=config["clickableLink"]
    )


@router.post("/analytics")
async def track_analytics(event: AnalyticsEvent, request: Request):
    """
    Track analytics events from the widget.
    
    Receives events from the widget (widget_loaded, video_loaded, banner_clicked)
    and stores them in MongoDB for analysis.
    
    Args:
        event: AnalyticsEvent containing event details
        request: FastAPI request object for extracting client IP
        
    Returns:
        Success confirmation
    """
    try:
        # Get client IP address
        client_ip = request.client.host if request.client else None
        
        # Prepare analytics document
        analytics_doc = {
            "event": event.event,
            "domain": event.domain,
            "timestamp": datetime.utcnow(),
            "userAgent": event.userAgent,
            "referrer": event.referrer,
            "clientIp": client_ip,
            "metadata": event.metadata or {}
        }
        
        # Store in MongoDB analytics collection
        await db.analytics.insert_one(analytics_doc)
        
        return {
            "success": True,
            "message": "Event tracked successfully"
        }
    except Exception as e:
        # Log error but don't fail the request (analytics should be non-blocking)
        print(f"Analytics tracking error: {str(e)}")
        return {
            "success": False,
            "message": "Event tracking failed",
            "error": str(e)
        }


@router.get("/analytics/stats")
async def get_analytics_stats():
    """
    Get analytics statistics.
    
    Returns counts of each event type for verification.
    """
    try:
        # Count total events
        total = await db.analytics.count_documents({})
        
        # Count each event type
        widget_loaded = await db.analytics.count_documents({"event": "widget_loaded"})
        video_loaded = await db.analytics.count_documents({"event": "video_loaded"})
        banner_clicked = await db.analytics.count_documents({"event": "banner_clicked"})
        
        # Get event counts by type
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
        
        event_counts = await db.analytics.aggregate(pipeline).to_list(length=20)
        events_by_type = {item["_id"]: item["count"] for item in event_counts}
        
        return {
            "total_events": total,
            "required_events": {
                "widget_loaded": widget_loaded,
                "video_loaded": video_loaded,
                "banner_clicked": banner_clicked
            },
            "all_events": events_by_type,
            "all_tracked": widget_loaded > 0 and video_loaded > 0 and banner_clicked > 0
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching analytics stats: {str(e)}"
        )
