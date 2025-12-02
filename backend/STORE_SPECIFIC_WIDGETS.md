# Store-Specific Widgets Guide

The widget system now supports **store-specific widgets**! Each store can have its own unique video banner and clickable link.

## How It Works

The widget supports two lookup methods:

1. **Domain-based** (default): Widget looks up configuration by domain name
2. **Store-based**: Widget looks up configuration by store ID (for store-specific widgets)

## Setup Store-Specific Widgets

### Method 1: Using the Seed Script

The seed script now automatically adds widget config to both stores:

```bash
cd backend
python app/seed.py
```

This will:
- Add widget config to `store_001` with BigBuckBunny video
- Add widget config to `store_002` with ElephantsDream video

### Method 2: Using the Add Widget Script

Add widget config to a specific store:

```bash
cd backend
python add_store_widget.py store_002 \
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4" \
  "http://localhost:3000/store/store_002" \
  "localhost"
```

### Method 3: Using MongoDB Directly

```javascript
// In mongosh
use 3d_store

db.stores.updateOne(
  { _id: "store_002" },
  {
    $set: {
      domain: "localhost",
      widgetConfig: {
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        clickableLink: "http://localhost:3000/store/store_002"
      }
    }
  }
)
```

## Using Store-Specific Widgets

### Option 1: Store-Specific Widget on Store Pages

To show a different widget for each store page, add the widget with a `data-store-id` attribute:

```tsx
// In app/store/[id]/page.tsx or any store-specific page
<Script
  src="http://localhost:8000/widget/video-banner-widget.js"
  data-api-url="http://localhost:8000"
  data-store-id="store_002"  // Store-specific widget
/>
```

### Option 2: Domain-Based Widget (All Pages)

For a single widget across all pages (current setup):

```tsx
// In app/layout.tsx
<Script
  src="http://localhost:8000/widget/video-banner-widget.js"
  data-api-url="http://localhost:8000"
  // No data-store-id = uses domain-based lookup
/>
```

### Option 3: Multiple Widgets on Same Page

You can have multiple widgets on the same page with different store IDs:

```html
<!-- Widget for store_001 -->
<script 
  src="http://localhost:8000/widget/video-banner-widget.js"
  data-api-url="http://localhost:8000"
  data-store-id="store_001">
</script>

<!-- Widget for store_002 -->
<script 
  src="http://localhost:8000/widget/video-banner-widget.js"
  data-api-url="http://localhost:8000"
  data-store-id="store_002">
</script>
```

**Note**: Each widget needs a unique ID. The widget automatically handles this.

## API Endpoints

### Store-Based Lookup

```
GET /api/widget/config?domain=localhost&store_id=store_002
```

Returns widget config for the specific store.

### Domain-Based Lookup

```
GET /api/widget/config?domain=localhost
```

Returns widget config for the first store found with that domain.

## Current Configuration

After running the seed script:

- **store_001**: 
  - Video: BigBuckBunny.mp4
  - Link: http://localhost:3000/store/store_001
  - Domain: localhost

- **store_002**: 
  - Video: ElephantsDream.mp4
  - Link: http://localhost:3000/store/store_002
  - Domain: localhost

## Testing Store-Specific Widgets

### Test Store 1 Widget

1. Add widget to a page with `data-store-id="store_001"`:
```html
<script 
  src="http://localhost:8000/widget/video-banner-widget.js"
  data-api-url="http://localhost:8000"
  data-store-id="store_001">
</script>
```

2. Open the page - you should see BigBuckBunny video

### Test Store 2 Widget

1. Add widget to a page with `data-store-id="store_002"`:
```html
<script 
  src="http://localhost:8000/widget/video-banner-widget.js"
  data-api-url="http://localhost:8000"
  data-store-id="store_002">
</script>
```

2. Open the page - you should see ElephantsDream video

### Test Domain-Based Widget

1. Use widget without `data-store-id`:
```html
<script 
  src="http://localhost:8000/widget/video-banner-widget.js"
  data-api-url="http://localhost:8000">
</script>
```

2. It will use the first store found with domain "localhost" (usually store_001)

## Priority Order

When both `store_id` and domain are available:

1. **Store ID** (if provided) - Uses store-specific config
2. **Domain** (fallback) - Uses domain-based lookup

## Examples

### Example 1: Store Page with Store-Specific Widget

```tsx
// app/store/[id]/page.tsx
import Script from "next/script";

export default function StorePage({ params }) {
  const storeId = params.id; // e.g., "store_002"
  
  return (
    <>
      {/* Your store page content */}
      
      {/* Store-specific widget */}
      <Script
        src="http://localhost:8000/widget/video-banner-widget.js"
        data-api-url="http://localhost:8000"
        data-store-id={storeId}
        strategy="afterInteractive"
      />
    </>
  );
}
```

### Example 2: Different Widgets for Different Domains

If you have multiple domains, each can have different widgets:

```javascript
// Store for domain1.com
db.stores.updateOne(
  { _id: "store_001" },
  { $set: { 
    domain: "domain1.com",
    widgetConfig: { ... }
  }}
)

// Store for domain2.com  
db.stores.updateOne(
  { _id: "store_002" },
  { $set: { 
    domain: "domain2.com",
    widgetConfig: { ... }
  }}
)
```

## Troubleshooting

### Widget Shows Wrong Video

- Check that `data-store-id` matches the store ID in MongoDB
- Verify the store has `widgetConfig` in MongoDB
- Check browser console for errors

### Widget Not Appearing

- Verify store exists: `db.stores.findOne({ _id: "store_002" })`
- Check widget config exists: `db.stores.findOne({ _id: "store_002" }).widgetConfig`
- Verify API endpoint: `curl "http://localhost:8000/api/widget/config?domain=localhost&store_id=store_002"`

### Both Widgets Show Same Video

- Make sure you're using `data-store-id` attribute
- Verify each store has different `widgetConfig` in MongoDB
- Check that the widget script is reading the `data-store-id` attribute

## Summary

✅ **Store-specific widgets** are now supported  
✅ **Each store** can have its own video and clickable link  
✅ **Use `data-store-id`** attribute to specify which store's widget to show  
✅ **Domain-based** lookup still works as fallback  
✅ **Seed script** automatically configures both stores with different videos

