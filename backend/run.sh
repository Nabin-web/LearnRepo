#!/bin/bash
# Run the FastAPI backend server

cd "$(dirname "$0")"
source .venv/Scripts/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
