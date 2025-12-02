# Video Banner Widget - Documentation

## Overview

The Video Banner Widget is a lightweight, embeddable JavaScript widget that displays a floating video banner at the bottom-left corner of any website. When clicked, it opens a clickable link in an iframe overlay. The widget is domain-aware and automatically fetches configuration from the backend based on the current domain.

## Table of Contents

1. [Architecture](#architecture)
2. [Design Decisions](#design-decisions)
3. [Implementation Details](#implementation-details)
4. [Backend API Design](#backend-api-design)
5. [Analytics Reporting](#analytics-reporting)
6. [Installation & Usage](#installation--usage)
7. [Database Schema](#database-schema)
8. [Security Considerations](#security-considerations)
9. [Performance Considerations](#performance-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Architecture

### System Components

```
┌─────────────────┐
│   Store Website │
│  (Any Domain)   │
│                 │
│  ┌───────────┐  │
│  │  Widget   │  │
│  │  Script   │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
         │ 1. Fetch Config (GET /api/widget/config?domain=...)
         │
         ▼
┌─────────────────┐
│   Backend API   │
│   (FastAPI)     │
│                 │
│  ┌───────────┐  │
│  │  MongoDB  │  │
│  │  Stores   │  │
│  │ Collection│  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │ Analytics │  │
│  │ Collection│  │
│  └───────────┘  │
└─────────────────┘
```

### Widget Flow

1. **Initialization**: Widget script loads and extracts current domain
2. **Configuration Fetch**: Calls backend API with domain to get video URL and clickable link
3. **Rendering**: Creates floating video banner with Shadow DOM for style isolation
4. **Event Tracking**: Reports three key events to analytics service:
   - `widget_loaded`: When widget script initializes
   - `video_loaded`: When video element is ready
   - `banner_clicked`: When user clicks the banner
5. **Modal Display**: Opens clickable link in iframe overlay on click

---

## Design Decisions

### 1. Vanilla JavaScript (No Dependencies)

**Decision**: Use pure JavaScript without frameworks or libraries.

**Rationale**:
- Minimal bundle size (~8KB minified)
- Fast load time
- No dependency conflicts with host site
- Easy to debug and maintain
- Works across all browsers

### 2. Shadow DOM for Style Isolation

**Decision**: Use Shadow DOM to encapsulate widget styles.

**Rationale**:
- Prevents CSS conflicts with host site
- Ensures consistent appearance across different sites
- Maintains widget styling integrity
- Modern browser support (all major browsers)

### 3. Domain-Based Configuration

**Decision**: Use domain name to look up widget configuration.

**Rationale**:
- No need to pass store IDs or API keys
- Automatic configuration based on where widget is embedded
- Supports multiple stores with different domains
- Simple integration for store owners

### 4. Backend Analytics Service

**Decision**: Send analytics events to our own backend service.

**Rationale**:
- Full control over analytics data
- No dependency on third-party services
- Can store detailed metadata
- Privacy-friendly (data stays in our system)
- Easy to query and analyze

### 5. Iframe Overlay for Clickable Links

**Decision**: Display clickable link in iframe modal overlay.

**Rationale**:
- Keeps user on original site (better UX)
- Prevents navigation away from store
- Allows for easy closing and return
- Supports any type of content (HTML, videos, etc.)

---

## Implementation Details

### Widget JavaScript Structure

```javascript
(function() {
  'use strict';
  
  // 1. Configuration extraction
  // 2. Analytics tracking function
  // 3. Configuration fetch function
  // 4. Widget rendering function
  // 5. Modal overlay function
  // 6. Initialization function
})();
```

### Key Features

- **Self-contained**: IIFE pattern prevents global namespace pollution
- **Async/Await**: Modern async handling for API calls
- **Error Handling**: Graceful degradation if API fails
- **Accessibility**: Keyboard navigation and ARIA labels
- **Responsive**: Adapts to mobile and desktop screens
- **Performance**: Uses `keepalive` flag for analytics requests

### Shadow DOM Structure

```
#video-banner-widget (Shadow Root)
├── <style> (CSS isolation)
└── .widget-container
    └── .video-banner
        └── <video>
```

---

## Backend API Design

### Endpoint: GET `/api/widget/config`

**Purpose**: Retrieve widget configuration for a given domain.

**Query Parameters**:
- `domain` (required): The domain name where widget is running

**Response**:
```json
{
  "videoUrl": "https://example.com/video.mp4",
  "clickableLink": "https://example.com/promotion"
}
```

**Error Responses**:
- `404`: Domain not found or widget config missing
- `500`: Invalid configuration (missing required fields)

**Domain Normalization**:
- Removes protocol (http://, https://)
- Removes www. prefix (tries both with and without)
- Case-insensitive matching
- Handles trailing slashes

### Endpoint: POST `/api/widget/analytics`

**Purpose**: Track analytics events from the widget.

**Request Body**:
```json
{
  "event": "widget_loaded",
  "domain": "example.com",
  "timestamp": "2024-01-15T10:30:00Z",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://google.com",
  "metadata": {
    "videoUrl": "https://example.com/video.mp4"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Event tracked successfully"
}
```

**Event Types**:
1. `widget_loaded`: Widget script initialized
2. `video_loaded`: Video element ready to play
3. `banner_clicked`: User clicked the video banner

---

## Analytics Reporting

### Analytics Service Choice

We chose to implement our own backend analytics service rather than using third-party services (like Google Analytics) for the following reasons:

1. **Data Ownership**: Full control over analytics data
2. **Privacy**: No data sharing with third parties
3. **Customization**: Can track exactly what we need
4. **Cost**: No per-event pricing or limits
5. **Reliability**: No dependency on external services
6. **Query Flexibility**: Can query MongoDB directly for insights

### Analytics Data Structure

Each event is stored in MongoDB with:
- Event type (widget_loaded, video_loaded, banner_clicked)
- Domain name
- Timestamp (UTC)
- User agent
- Referrer URL
- Client IP address
- Custom metadata (video URL, clickable link, etc.)

### Analytics Queries

Example MongoDB queries for analytics:

```javascript
// Count widget loads per domain
db.analytics.aggregate([
  { $match: { event: "widget_loaded" } },
  { $group: { _id: "$domain", count: { $sum: 1 } } }
])

// Click-through rate
db.analytics.aggregate([
  { $match: { event: { $in: ["widget_loaded", "banner_clicked"] } } },
  { $group: { _id: "$domain", events: { $push: "$event" } } }
])
```

---

## Installation & Usage

### For Store Owners (Embedding the Widget)

1. **Add the script tag** to your website's HTML:

```html
<script 
  src="https://your-backend-domain.com/widget/video-banner-widget.js"
  data-api-url="https://your-backend-domain.com">
</script>
```

2. **Ensure your store is registered** in MongoDB with:
   - `domain`: Your website's domain (e.g., "example.com")
   - `widgetConfig.videoUrl`: URL to your video file
   - `widgetConfig.clickableLink`: URL to open when clicked

### For Developers (Setting Up Backend)

1. **Ensure MongoDB is running** and accessible
2. **Create store documents** with widget configuration:

```javascript
db.stores.insertOne({
  domain: "example.com",
  name: "Example Store",
  widgetConfig: {
    videoUrl: "https://example.com/promotional-video.mp4",
    clickableLink: "https://example.com/special-offer"
  }
})
```

3. **Start the backend server**:
```bash
cd backend
./run.sh
```

---

## Database Schema

### Stores Collection

```javascript
{
  _id: ObjectId("..."),
  domain: "example.com",           // Unique domain identifier
  name: "Example Store",
  widgetConfig: {
    videoUrl: "https://...",       // Video URL for banner
    clickableLink: "https://..."    // Link to open on click
  },
  // ... other store fields
}
```

### Analytics Collection

```javascript
{
  _id: ObjectId("..."),
  event: "widget_loaded",           // Event type
  domain: "example.com",            // Domain where event occurred
  timestamp: ISODate("..."),        // UTC timestamp
  userAgent: "Mozilla/5.0...",     // Browser user agent
  referrer: "https://google.com",   // Referrer URL
  clientIp: "192.168.1.1",         // Client IP address
  metadata: {                       // Additional event data
    videoUrl: "https://...",
    clickableLink: "https://..."
  }
}
```

---

## Security Considerations

### 1. CORS Configuration

The backend must allow CORS from any domain where widgets are embedded:

```python
origins = ["*"]  # In production, consider whitelisting specific domains
```

### 2. Input Validation

- Domain parameter is validated and normalized
- Video URLs and clickable links should be validated (HTTPS recommended)
- Analytics events are validated using Pydantic models

### 3. XSS Prevention

- Widget uses Shadow DOM to isolate from host page
- All user inputs are sanitized
- Iframe sandbox attributes could be added for additional security

### 4. Rate Limiting

Consider implementing rate limiting on:
- `/api/widget/config` endpoint (prevent abuse)
- `/api/widget/analytics` endpoint (prevent spam)

### 5. Content Security Policy (CSP)

Store owners may need to adjust CSP headers to allow:
- Inline scripts (widget script)
- Video sources from your CDN
- Iframe sources for clickable links

---

## Performance Considerations

### 1. Widget Load Time

- Widget script is small (~8KB)
- Uses async/await for non-blocking API calls
- Renders only after configuration is fetched

### 2. Video Loading

- Video uses `preload="auto"` for faster display
- `playsinline` attribute for mobile optimization
- `muted` and `autoplay` for autoplay support

### 3. Analytics Performance

- Analytics requests use `keepalive: true` flag
- Non-blocking (errors don't affect widget functionality)
- Batched writes could be implemented for high-traffic scenarios

### 4. Caching

- Consider caching widget configuration in browser (localStorage)
- Cache-Control headers on video files
- CDN for video delivery

---

## Troubleshooting

### Widget Not Appearing

1. **Check browser console** for errors
2. **Verify domain** is registered in MongoDB
3. **Check API endpoint** is accessible (CORS issues)
4. **Verify video URL** is accessible and valid format

### Video Not Loading

1. **Check video URL** is correct and accessible
2. **Verify video format** (MP4 recommended)
3. **Check CORS** on video hosting
4. **Browser compatibility** (check console for errors)

### Analytics Not Tracking

1. **Check network tab** for failed requests
2. **Verify backend endpoint** is running
3. **Check MongoDB connection**
4. **Review backend logs** for errors

### Modal Not Opening

1. **Check clickable link URL** is valid
2. **Verify iframe** is not blocked by CSP
3. **Check browser console** for errors
4. **Test URL** in browser directly

---

## Future Enhancements

1. **A/B Testing**: Support multiple video variants per domain
2. **Scheduling**: Show/hide widget based on time or date
3. **Geolocation**: Different content based on user location
4. **Personalization**: Customize based on user behavior
5. **Analytics Dashboard**: Visual dashboard for analytics data
6. **Widget Customization**: Allow stores to customize appearance
7. **Video Formats**: Support WebM, HLS, DASH formats
8. **Lazy Loading**: Load widget only when in viewport

---

## Support

For issues or questions:
- Check this documentation
- Review backend logs
- Check MongoDB connection
- Verify store configuration in database

