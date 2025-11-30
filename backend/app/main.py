from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

fastapi_app = FastAPI()

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
]

fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
