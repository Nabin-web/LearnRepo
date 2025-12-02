# Backend Dockerfile for Render deployment
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Make startup script executable
RUN chmod +x start.sh

# Expose port (Render will set PORT env var, default to 8000)
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Run the startup script
# The script will optionally run insert_widget_store.py if:
#   RUN_INSERT_WIDGET_STORE=true
#   WIDGET_DOMAIN=your-domain.com
# Then it starts the FastAPI server
CMD ["./start.sh"]

