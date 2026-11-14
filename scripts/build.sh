#!/bin/bash

# Build the Svelte frontend
cd frontend
npm install
npm run build

# Build the Go backend
cd ../backend
go build -o blood_pressure_monitor ./cmd/main.go

echo "Build completed successfully!"
echo "Frontend: frontend/public"
echo "Backend: backend/blood_pressure_monitor"
