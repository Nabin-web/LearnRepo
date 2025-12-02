from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

fastapi_app = FastAPI()

# CORS Configuration
# Allow all origins for widget embedding (in production, consider whitelisting)
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "*"  # Allow widget embedding from any domain
]

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for widget
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve widget static files
# First try local widget directory (for production deployment)
widget_path = os.path.join(os.path.dirname(__file__), "..", "widget")
if not os.path.exists(widget_path):
    # Fallback to frontend/public/widget (for local development)
    widget_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "widget")
if os.path.exists(widget_path):
    fastapi_app.mount("/widget", StaticFiles(directory=widget_path), name="widget")

@fastapi_app.get("/")
async def root():
    return {"message": "Hello World"}

from app.routers import stores, widget, models
from app.socket_manager import sio
import app.websocket.handlers  # Register handlers

# Include routers
fastapi_app.include_router(stores.router)
fastapi_app.include_router(widget.router)
fastapi_app.include_router(models.router)

# Wrap FastAPI with Socket.IO
import socketio
app = socketio.ASGIApp(sio, fastapi_app)
