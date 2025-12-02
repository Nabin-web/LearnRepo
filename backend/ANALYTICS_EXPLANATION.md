# Analytics Reporting - Explanation

## Choice: Custom Backend Analytics Service

We chose to implement our own backend analytics service rather than using third-party services like Google Analytics, Mixpanel, or Amplitude.

## Rationale

### 1. **Data Ownership & Privacy**
- **Full Control**: All analytics data stays within our infrastructure
- **No Third-Party Sharing**: Data is never shared with external analytics providers
- **GDPR/Privacy Compliance**: Easier to comply with privacy regulations when data is self-hosted
- **Data Retention**: Complete control over how long data is retained

### 2. **Cost Efficiency**
- **No Per-Event Pricing**: Third-party services often charge per event or have usage limits
- **No Subscription Fees**: No monthly/annual fees for analytics services
- **Scalable**: Can handle high traffic without additional costs
- **Predictable Costs**: Only infrastructure costs (MongoDB storage)

### 3. **Customization & Flexibility**
- **Custom Events**: Can track exactly what we need without limitations
- **Custom Metadata**: Store any additional data we want (video URLs, user context, etc.)
- **Query Flexibility**: Direct MongoDB queries for any analysis
- **Real-time Analytics**: Can build real-time dashboards using the data

### 4. **Reliability & Performance**
- **No External Dependencies**: Widget doesn't depend on third-party services being available
- **Faster Response**: No external API calls for analytics (only our own backend)
- **Non-Blocking**: Analytics failures don't affect widget functionality
- **Uptime Control**: We control the availability of our analytics service

### 5. **Integration & Development**
- **Unified Backend**: Analytics uses the same backend infrastructure
- **Easy Debugging**: Can debug analytics issues alongside widget issues
- **Consistent Stack**: Uses same MongoDB database as the rest of the application
- **Simple Implementation**: No need to learn third-party APIs or SDKs

## Implementation Details

### Analytics Endpoint

**Endpoint**: `POST /api/widget/analytics`

**Request Body**:
```json
{
  "event": "widget_loaded",
  "domain": "example.com",
  "timestamp": "2024-01-15T10:30:00Z",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://google.com",
  "metadata": {
    "videoUrl": "https://example.com/video.mp4",
    "clickableLink": "https://example.com/promotion"
  }
}
```

### Event Types Tracked

1. **`widget_loaded`**
   - Fired when widget script initializes
   - Indicates successful widget installation and initialization
   - Metadata: videoUrl, clickableLink

2. **`video_loaded`**
   - Fired when video element is ready to play
   - Indicates successful video loading
   - Metadata: videoUrl

3. **`banner_clicked`**
   - Fired when user clicks the video banner
   - Indicates user engagement
   - Metadata: clickableLink

### Data Storage

Events are stored in MongoDB `analytics` collection:

```javascript
{
  _id: ObjectId("..."),
  event: "widget_loaded",
  domain: "example.com",
  timestamp: ISODate("2024-01-15T10:30:00Z"),
  userAgent: "Mozilla/5.0...",
  referrer: "https://google.com",
  clientIp: "192.168.1.1",
  metadata: {
    videoUrl: "https://example.com/video.mp4",
    clickableLink: "https://example.com/promotion"
  }
}
```

### Analytics Queries

Example queries for insights:

```javascript
// Widget loads per domain
db.analytics.aggregate([
  { $match: { event: "widget_loaded" } },
  { $group: { _id: "$domain", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])

// Click-through rate calculation
db.analytics.aggregate([
  { $match: { domain: "example.com" } },
  { $group: {
    _id: "$event",
    count: { $sum: 1 }
  }},
  { $group: {
    _id: null,
    loads: { $sum: { $cond: [{ $eq: ["$_id", "widget_loaded"] }, "$count", 0] }},
    clicks: { $sum: { $cond: [{ $eq: ["$_id", "banner_clicked"] }, "$count", 0] }}
  }},
  { $project: {
    clickThroughRate: { $divide: ["$clicks", "$loads"] }
  }}
])

// Video load success rate
db.analytics.aggregate([
  { $match: { domain: "example.com" } },
  { $group: {
    _id: null,
    widgetsLoaded: { $sum: { $cond: [{ $eq: ["$event", "widget_loaded"] }, 1, 0] }},
    videosLoaded: { $sum: { $cond: [{ $eq: ["$event", "video_loaded"] }, 1, 0] }}
  }},
  { $project: {
    videoLoadRate: { $divide: ["$videosLoaded", "$widgetsLoaded"] }
  }}
])
```

## Alternative Options Considered

### Google Analytics
- **Pros**: Well-established, free tier, good dashboards
- **Cons**: Privacy concerns, data sharing, limited customization, requires additional script

### Mixpanel
- **Pros**: Good event tracking, user-friendly interface
- **Cons**: Expensive at scale, per-event pricing, external dependency

### Amplitude
- **Pros**: Great for product analytics, good visualizations
- **Cons**: Expensive, complex setup, external dependency

### Self-Hosted (Our Choice) ✅
- **Pros**: Full control, privacy, cost-effective, customizable
- **Cons**: Need to build dashboards (but we have full flexibility)

## Future Enhancements

1. **Analytics Dashboard**: Build a web dashboard to visualize analytics data
2. **Real-time Monitoring**: WebSocket-based real-time analytics updates
3. **Advanced Metrics**: Calculate conversion rates, engagement metrics, etc.
4. **Export Functionality**: Export analytics data for external analysis
5. **Data Aggregation**: Pre-aggregate common metrics for faster queries
6. **Retention Policies**: Automatically archive or delete old analytics data

## Conclusion

Our custom analytics solution provides the best balance of:
- **Control**: Full ownership of data and infrastructure
- **Cost**: No per-event or subscription fees
- **Privacy**: No data sharing with third parties
- **Flexibility**: Custom events and metadata
- **Reliability**: No external dependencies

This approach is particularly suitable for a widget that needs to be embedded across multiple domains, where we want consistent, reliable analytics without external dependencies or privacy concerns.

