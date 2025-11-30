# Backend API

A FastAPI-based backend server with MongoDB integration and WebSocket support using Socket.IO.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.12** or higher
- **MongoDB** (local installation or MongoDB Atlas account)
- **pip** (Python package manager)

## Installation

### 1. Clone the Repository

If you haven't already, navigate to the backend directory:

```bash
cd backend
```

### 2. Create a Virtual Environment

Create a Python virtual environment to isolate project dependencies:

```bash
python3 -m venv venv
```

### 3. Activate the Virtual Environment

**On macOS/Linux:**
```bash
source venv/bin/activate
```

**On Windows:**
```bash
venv\Scripts\activate
```

### 4. Install Dependencies

Install all required Python packages:

```bash
pip install -r requirements.txt
```

## Configuration

### Environment Variables

Create a `.env` file in the `backend` directory to configure your environment:

```bash
touch .env
```

Add the following variables to your `.env` file:

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=3d_store
```

**For MongoDB Atlas (cloud):**
```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=3d_store
```

**Note:** Replace `username` and `password` with your MongoDB Atlas credentials.

## Running the Application

### Option 1: Using the Run Script (Recommended)

Make the script executable (first time only):

```bash
chmod +x run.sh
```

Run the server:

```bash
./run.sh
```

### Option 2: Manual Start

Activate your virtual environment (if not already activated):

```bash
source venv/bin/activate
```

Start the server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start on `http://localhost:8000` with auto-reload enabled for development.

### Option 3: Using Python Directly

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Testing the Connection

To test your MongoDB connection, run:

```bash
python test_connection.py
```

This will verify that your MongoDB connection is working correctly.

## API Endpoints

Once the server is running, you can access:

- **API Root:** `http://localhost:8000/`
- **API Documentation (Swagger UI):** `http://localhost:8000/docs`
- **Alternative API Docs (ReDoc):** `http://localhost:8000/redoc`

## WebSocket Support

The backend includes Socket.IO WebSocket support. WebSocket connections are available at the root endpoint.

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # MongoDB connection
│   ├── models/              # Data models
│   ├── routers/             # API route handlers
│   ├── services/            # Business logic services
│   ├── websocket/           # WebSocket handlers
│   └── seed.py              # Database seeding script
├── venv/                    # Virtual environment (gitignored)
├── requirements.txt         # Python dependencies
├── run.sh                   # Run script
├── test_connection.py       # MongoDB connection test
└── README.md                # This file
```

## Troubleshooting

### MongoDB Connection Issues

1. **Local MongoDB:** Ensure MongoDB is running locally:
   ```bash
   # Check if MongoDB is running
   mongosh
   ```

2. **MongoDB Atlas:** 
   - Verify your connection string in `.env`
   - Check that your IP address is whitelisted in MongoDB Atlas
   - Ensure your username and password are correct

3. **Test Connection:** Run `python test_connection.py` to diagnose connection issues

### Port Already in Use

If port 8000 is already in use, you can specify a different port:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### Virtual Environment Issues

If you encounter issues with the virtual environment:

```bash
# Remove existing venv
rm -rf venv

# Create a new one
python3 -m venv venv

# Activate and reinstall
source venv/bin/activate
pip install -r requirements.txt
```

## Development

The server runs with `--reload` flag enabled, which means it will automatically restart when you make changes to the code.

## Dependencies

Key dependencies include:
- **FastAPI** - Modern web framework
- **Uvicorn** - ASGI server
- **Motor** - Async MongoDB driver
- **Socket.IO** - WebSocket support
- **Pydantic** - Data validation
- **Boto3** - AWS SDK (if using AWS services)

For a complete list, see `requirements.txt`.

