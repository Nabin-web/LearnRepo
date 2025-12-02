# Video Banner Widget - Quick Setup Guide

## Quick Start

### 1. Backend Setup

Ensure your backend is running:
```bash
cd backend
./run.sh
```

### 2. MongoDB Setup

Create a store document with widget configuration:

```javascript
// Connect to MongoDB
mongosh

// Use your database
use 3d_store

// Insert a store with widget config
db.stores.insertOne({
  domain: "localhost",  // or your actual domain
  name: "Test Store",
  widgetConfig: {
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    clickableLink: "https://example.com"
  }
})
```

**Note**: Replace `domain` with the actual domain where you'll embed the widget. For local testing, use `"localhost"`.

### 3. Embed the Widget

Add this script tag to any HTML page:

```html
<script 
  src="http://localhost:8000/widget/video-banner-widget.js"
  data-api-url="http://localhost:8000">
</script>
```

### 4. Test

1. Open the HTML page in your browser
2. Check the browser console for any errors
3. The widget should appear at the bottom-left corner
4. Click it to see the iframe overlay

## Example HTML File

See `frontend/public/widget-example.html` for a complete example.

## API Endpoints

### GET `/api/widget/config?domain=example.com`

Returns widget configuration for a domain:
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "clickableLink": "https://example.com/promotion"
}
```

### POST `/api/widget/analytics`

Tracks analytics events:
```json
{
  "event": "widget_loaded",
  "domain": "example.com",
  "timestamp": "2024-01-15T10:30:00Z",
  "userAgent": "...",
  "referrer": "...",
  "metadata": {}
}
```

## Troubleshooting

- **Widget not appearing?** Check browser console and verify domain is in MongoDB
- **CORS errors?** Backend is configured to allow all origins
- **Video not loading?** Verify video URL is accessible
- **Analytics not working?** Check backend logs and MongoDB connection

## Files

- **Widget Script**: `frontend/public/widget/video-banner-widget.js`
- **Backend Router**: `backend/app/routers/widget.py`
- **Documentation**: `backend/WIDGET_DOCUMENTATION.md`
- **Example**: `frontend/public/widget-example.html`

