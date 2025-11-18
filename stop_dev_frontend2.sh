#!/bin/bash
# Stop backend and frontend2 dev servers

pkill -f "uvicorn app.main:app"
pkill -f "vite"
echo "Stopped backend and frontend2 dev servers."
