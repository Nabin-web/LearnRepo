# How to Check Analytics Events

This guide shows you multiple ways to verify that the three required analytics events are being tracked:

1. **Widget Loaded** - Script inserted and initialized
2. **Video Loaded** - Video element is ready
3. **Banner Clicked** - User clicked the banner

---

## Method 1: Using Python Script (Easiest) ✅

I've created a script that queries MongoDB and shows all analytics events:

```bash
cd backend
python check_analytics.py
```

This will show:
- Total number of events
- Count of each event type
- Recent events
- Events by domain
- Summary of the three required events

**Example Output:**
```
============================================================
Widget Analytics Events
============================================================

📊 Total Analytics Events: 15

📈 Events by Type:
------------------------------------------------------------
  ✅ widget_loaded: 5
  ✅ video_loaded: 5
  ✅ banner_clicked: 5

✅ Required Events Check:
------------------------------------------------------------
  ✅ widget_loaded: 5 event(s)
  ✅ video_loaded: 5 event(s)
  ✅ banner_clicked: 5 event(s)

🎉 All three required events are being tracked!
```

---

## Method 2: Browser DevTools Network Tab

### Step 1: Open Browser DevTools
- Press `F12` or `Right-click → Inspect`
- Go to the **Network** tab

### Step 2: Filter for Analytics Requests
- In the filter box, type: `analytics`
- Or look for requests to: `/api/widget/analytics`

### Step 3: Load a Page with Widget
- Navigate to a page with the widget (e.g., `http://localhost:3000`)
- You should see **3 requests** appear:

1. **widget_loaded** - Appears immediately when page loads
2. **video_loaded** - Appears when video is ready (usually within 1-2 seconds)
3. **banner_clicked** - Appears when you click the video banner

### Step 4: Inspect the Requests
Click on each request to see:
- **Request Payload**: The event data being sent
- **Response**: Should be `{"success": true, "message": "Event tracked successfully"}`

**Example Request Payload:**
```json
{
  "event": "widget_loaded",
  "domain": "localhost",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "userAgent": "Mozilla/5.0...",
  "referrer": "",
  "metadata": {
    "videoUrl": "https://...",
    "clickableLink": "https://..."
  }
}
```

---

## Method 3: Browser Console

The widget logs events to the console for debugging:

### Step 1: Open Browser Console
- Press `F12` or `Right-click → Inspect`
- Go to the **Console** tab

### Step 2: Look for Log Messages
You should see messages like:
```
[Widget Analytics] widget_loaded {event: "widget_loaded", domain: "localhost", ...}
[Widget Analytics] video_loaded {event: "video_loaded", domain: "localhost", ...}
[Widget Analytics] banner_clicked {event: "banner_clicked", domain: "localhost", ...}
```

**Note**: These are just console logs. The actual events are sent to the backend API.

---

## Method 4: MongoDB Shell (mongosh)

### Step 1: Connect to MongoDB
```bash
mongosh
use 3d_store
```

### Step 2: Check Total Events
```javascript
db.analytics.countDocuments({})
```

### Step 3: Count Each Event Type
```javascript
// Widget Loaded
db.analytics.countDocuments({ event: "widget_loaded" })

// Video Loaded
db.analytics.countDocuments({ event: "video_loaded" })

// Banner Clicked
db.analytics.countDocuments({ event: "banner_clicked" })
```

### Step 4: View Recent Events
```javascript
db.analytics.find().sort({ timestamp: -1 }).limit(10).pretty()
```

### Step 5: Group Events by Type
```javascript
db.analytics.aggregate([
  {
    $group: {
      _id: "$event",
      count: { $sum: 1 }
    }
  },
  {
    $sort: { count: -1 }
  }
])
```

---

## Method 5: Backend Logs

Check your backend server console for analytics tracking:

When events are received, you might see (if logging is enabled):
```
Analytics event received: widget_loaded
Analytics event received: video_loaded
Analytics event received: banner_clicked
```

If there are errors, you'll see:
```
Analytics tracking error: ...
```

---

## Step-by-Step Testing Checklist

Follow these steps to verify all three events:

### ✅ Step 1: Start Backend
```bash
cd backend
./run.sh
```

### ✅ Step 2: Start Frontend
```bash
cd frontend
npm run dev
```

### ✅ Step 3: Open Browser
- Navigate to `http://localhost:3000`
- Open DevTools (F12)
- Go to Network tab and filter for "analytics"

### ✅ Step 4: Verify Widget Loaded
- **Action**: Just load the page
- **Expected**: See `widget_loaded` event in Network tab
- **Timing**: Should appear immediately

### ✅ Step 5: Verify Video Loaded
- **Action**: Wait 1-2 seconds after page load
- **Expected**: See `video_loaded` event in Network tab
- **Timing**: Appears when video element is ready

### ✅ Step 6: Verify Banner Clicked
- **Action**: Click the video banner at bottom-left
- **Expected**: See `banner_clicked` event in Network tab
- **Timing**: Appears immediately on click

### ✅ Step 7: Check Analytics in MongoDB
```bash
cd backend
python check_analytics.py
```

---

## Troubleshooting

### No Events Appearing?

1. **Check Backend is Running**
   ```bash
   curl http://localhost:8000/
   ```
   Should return: `{"message":"Hello World"}`

2. **Check MongoDB Connection**
   ```bash
   cd backend
   python test_connection.py
   ```

3. **Check Widget Script is Loading**
   - Open browser console
   - Look for errors
   - Check Network tab for `video-banner-widget.js` request

4. **Check Store Document Exists**
   ```bash
   cd backend
   python -c "import asyncio; from app.database import db; print(asyncio.run(db.stores.find_one({'domain': 'localhost'})))"
   ```

### Events Appearing But Not in MongoDB?

1. **Check Backend Logs** for errors
2. **Check MongoDB Connection** in backend
3. **Verify Analytics Endpoint** is working:
   ```bash
   curl -X POST http://localhost:8000/api/widget/analytics \
     -H "Content-Type: application/json" \
     -d '{"event":"test","domain":"localhost"}'
   ```

### Only Some Events Appearing?

- **widget_loaded missing?** - Widget script not loading
- **video_loaded missing?** - Video URL not accessible or video not loading
- **banner_clicked missing?** - Need to actually click the banner

---

## Quick Verification Commands

### Check All Events at Once
```bash
cd backend
python check_analytics.py
```

### Check via MongoDB Shell
```javascript
// In mongosh
use 3d_store
db.analytics.find({ event: { $in: ["widget_loaded", "video_loaded", "banner_clicked"] } }).count()
```

### Check via API (if you add an endpoint)
```bash
curl http://localhost:8000/api/widget/analytics/stats
```

---

## Expected Results

After testing, you should see:

✅ **widget_loaded**: At least 1 event (every time a page with widget loads)  
✅ **video_loaded**: At least 1 event (every time video loads successfully)  
✅ **banner_clicked**: At least 1 event (every time user clicks banner)

**Success Criteria**: All three event types have at least 1 event recorded in MongoDB.

---

## Summary

**Easiest Method**: Use `python check_analytics.py` - it shows everything you need!

**Real-time Method**: Use Browser DevTools Network tab to see events as they happen.

**Database Method**: Query MongoDB directly to see stored events.

All three methods confirm that the analytics service is working correctly! 🎉


