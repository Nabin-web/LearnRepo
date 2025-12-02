# Widget Embedding Guide for Next.js Frontend

## ✅ What's Already Done

The widget script has been added to your Next.js app in `app/layout.tsx`. It will automatically load on **all pages** of your application.

## 📍 Where the Widget is Embedded

**File**: `frontend/app/layout.tsx`

The widget script is added at the bottom of the `<body>` tag using Next.js's `Script` component:

```tsx
<Script
  src="http://localhost:8000/widget/video-banner-widget.js"
  data-api-url="http://localhost:8000"
  strategy="afterInteractive"
/>
```

## 🎯 What This Means

- ✅ **Widget loads on all pages** - Home page, store pages, etc.
- ✅ **Automatic domain detection** - Widget detects `localhost` (or your domain)
- ✅ **No additional setup needed** - The widget is self-contained

## 🔧 Configuration

### For Development (Current Setup)

The widget is configured for local development:
- **Script URL**: `http://localhost:8000/widget/video-banner-widget.js`
- **API URL**: `http://localhost:8000`
- **Domain**: `localhost` (automatically detected)

### For Production

When deploying to production, update the script in `layout.tsx`:

```tsx
<Script
  src="https://your-backend-domain.com/widget/video-banner-widget.js"
  data-api-url="https://your-backend-domain.com"
  strategy="afterInteractive"
/>
```

And make sure your MongoDB store document uses your production domain:

```javascript
db.stores.insertOne({
  domain: "yourdomain.com",  // Your actual domain
  widgetConfig: {
    videoUrl: "https://your-cdn.com/video.mp4",
    clickableLink: "https://yourdomain.com/promotion"
  }
})
```

## 🚫 Do You Need to Do Anything Else in Frontend?

**No!** The widget is completely self-contained:

- ✅ **No React components needed** - It's vanilla JavaScript
- ✅ **No state management** - Widget manages its own state
- ✅ **No imports required** - It loads as an external script
- ✅ **No CSS conflicts** - Uses Shadow DOM for isolation
- ✅ **Works automatically** - Just needs the script tag

## 🧪 Testing

1. **Start the backend**:
   ```bash
   cd backend
   ./run.sh
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser** to `http://localhost:3000`

4. **Look for the widget** at the bottom-left corner of the page

5. **Check browser console** for any errors (should see "Widget event: widget_loaded")

## 🎨 Widget Behavior

The widget will:
- Appear at the **bottom-left corner** of every page
- Stay **fixed** while scrolling
- **Auto-play** the video (muted, looped)
- Open the clickable link in an **iframe overlay** when clicked
- Track analytics events automatically

## 🔍 Troubleshooting

### Widget Not Appearing?

1. **Check backend is running**: `http://localhost:8000` should be accessible
2. **Check MongoDB**: Verify store document exists with domain "localhost"
3. **Check browser console**: Look for errors
4. **Check network tab**: Verify script loads successfully

### Widget Appears But Video Doesn't Load?

1. **Check video URL**: Verify the video URL in MongoDB is accessible
2. **Check CORS**: Video hosting must allow cross-origin requests
3. **Check browser console**: Look for video loading errors

### Want Widget on Specific Pages Only?

If you want the widget only on specific pages, you can:

**Option 1**: Remove from `layout.tsx` and add to specific pages:

```tsx
// In app/page.tsx or app/store/[id]/page.tsx
import Script from "next/script";

export default function Page() {
  return (
    <>
      {/* Your page content */}
      <Script
        src="http://localhost:8000/widget/video-banner-widget.js"
        data-api-url="http://localhost:8000"
        strategy="afterInteractive"
      />
    </>
  );
}
```

**Option 2**: Use environment variable to conditionally load:

```tsx
// In layout.tsx
{process.env.NEXT_PUBLIC_ENABLE_WIDGET === 'true' && (
  <Script
    src="http://localhost:8000/widget/video-banner-widget.js"
    data-api-url="http://localhost:8000"
    strategy="afterInteractive"
  />
)}
```

## 📝 Summary

- ✅ Widget is already embedded in `app/layout.tsx`
- ✅ No additional frontend code needed
- ✅ Widget works automatically on all pages
- ✅ Just ensure backend is running and MongoDB has the store document

That's it! The widget should work out of the box. 🎉

