#!/bin/bash

# Start the Blood Pressure Monitor server

echo "Starting Blood Pressure Monitor..."

# Check if Go binary exists
if [ ! -f "backend/blood_pressure_monitor" ]; then
    echo "Backend binary not found. Running build first..."
    ./scripts/build.sh
fi

# Start the backend server
cd backend
./blood_pressure_monitor
