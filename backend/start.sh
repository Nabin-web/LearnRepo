#!/bin/sh
# Startup script for backend container
# Optionally runs insert_widget_store.py if environment variables are set

# If RUN_INSERT_WIDGET_STORE is set to "true" and WIDGET_DOMAIN is provided
if [ "$RUN_INSERT_WIDGET_STORE" = "true" ] && [ -n "$WIDGET_DOMAIN" ]; then
    echo "Running insert_widget_store.py for domain: $WIDGET_DOMAIN"
    python3 insert_widget_store.py --domain "$WIDGET_DOMAIN" --update || {
        echo "Warning: Failed to insert widget store. Continuing anyway..."
    }
else
    echo "Skipping insert_widget_store.py (set RUN_INSERT_WIDGET_STORE=true and WIDGET_DOMAIN to enable)"
fi

# Start the FastAPI application
echo "Starting FastAPI server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}

