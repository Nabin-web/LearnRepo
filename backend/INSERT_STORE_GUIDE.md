# How to Insert a Store with Widget Configuration

There are several ways to insert the store document into MongoDB. Choose the method that works best for you.

## Method 1: Using Python Script (Recommended) ✅

The easiest way is to use the provided Python script:

```bash
cd backend
python insert_widget_store.py
```

This script will:

- Check if a store with domain "localhost" already exists
- Insert the store if it doesn't exist
- Update it if it exists (with confirmation)

**Customize the script**: Edit `insert_widget_store.py` to change the domain, video URL, or clickable link.

---

## Method 2: Using MongoDB Shell (mongosh)

If you have MongoDB shell installed:

### Step 1: Connect to MongoDB

**For local MongoDB:**

```bash
mongosh
```

**For MongoDB Atlas (cloud):**

```bash
mongosh "mongodb+srv://username:password@cluster.mongodb.net/"
```

### Step 2: Select the Database

```javascript
use 3d_store
```

### Step 3: Insert the Store

```javascript
db.stores.insertOne({
  domain: "localhost",
  name: "Test Store",
  widgetConfig: {
    videoUrl:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    clickableLink: "https://example.com",
  },
  activeUsers: 0,
});
```

### Step 4: Verify the Insert

```javascript
// Check if the store was inserted
db.stores.findOne({ domain: "localhost" });

// List all stores
db.stores.find().pretty();
```

---

## Method 3: Using the Seed Script

You can modify the existing `seed.py` script or add to it:

```bash
cd backend
python app/seed.py
```

The seed script already includes widget configuration for `store_001` with domain "localhost". You can modify it to add more stores.

---

## Method 4: Using MongoDB Compass (GUI)

If you prefer a graphical interface:

1. **Open MongoDB Compass**
2. **Connect** to your MongoDB instance (local or Atlas)
3. **Navigate** to the `3d_store` database
4. **Select** the `stores` collection
5. **Click** "Insert Document"
6. **Paste** this JSON:

```json
{
  "domain": "localhost",
  "name": "Test Store",
  "widgetConfig": {
    "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "clickableLink": "https://example.com"
  },
  "activeUsers": 0
}
```

7. **Click** "Insert"

---

## Method 5: Using Python Interactive Shell

You can also use Python directly:

```bash
cd backend
python
```

Then in Python:

```python
import asyncio
from app.database import db

async def insert():
    result = await db.stores.insert_one({
        "domain": "localhost",
        "name": "Test Store",
        "widgetConfig": {
            "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "clickableLink": "https://example.com"
        },
        "activeUsers": 0
    })
    print(f"Inserted: {result.inserted_id}")

asyncio.run(insert())
```

---

## Customizing the Store

You can customize any of these fields:

- **`domain`**: The domain where the widget will be embedded (e.g., "example.com", "localhost")
- **`name`**: Store name (optional, for reference)
- **`widgetConfig.videoUrl`**: URL to the video file (MP4 recommended)
- **`widgetConfig.clickableLink`**: URL to open when user clicks the banner
- **`activeUsers`**: Number of active users (default: 0)

### Example for Production:

```javascript
db.stores.insertOne({
  domain: "mystore.com",
  name: "My Store",
  widgetConfig: {
    videoUrl: "https://cdn.mystore.com/promotional-video.mp4",
    clickableLink: "https://mystore.com/special-offer",
  },
  activeUsers: 0,
});
```

---

## Verifying the Insert

After inserting, verify the store exists:

### Using MongoDB Shell:

```javascript
db.stores.findOne({ domain: "localhost" });
```

### Using Python:

```bash
cd backend
python -c "import asyncio; from app.database import db; print(asyncio.run(db.stores.find_one({'domain': 'localhost'})))"
```

### Test the API:

```bash
curl "http://localhost:8000/api/widget/config?domain=localhost"
```

Expected response:

```json
{
  "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  "clickableLink": "https://example.com"
}
```

---

## Troubleshooting

### "Store already exists"

If you get an error that the store already exists:

- **Option 1**: Update the existing store (see Method 1 script)
- **Option 2**: Delete and reinsert:
  ```javascript
  db.stores.deleteOne({ domain: "localhost" });
  // Then insert again
  ```

### "Connection failed"

- Check MongoDB is running: `mongosh` (for local) or check Atlas connection
- Verify `.env` file has correct `MONGODB_URL`
- Test connection: `python test_connection.py`

### "Database not found"

- The database will be created automatically when you insert the first document
- Or create it manually: `use 3d_store` in mongosh

---

## Quick Reference

**Database**: `3d_store`  
**Collection**: `stores`  
**Required Fields**: `domain`, `widgetConfig.videoUrl`, `widgetConfig.clickableLink`

**Recommended Method**: Use `insert_widget_store.py` script (Method 1) for the easiest setup!
