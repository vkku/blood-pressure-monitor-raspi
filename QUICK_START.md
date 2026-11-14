# Blood Pressure Monitor - Quick Start Guide

## Project Structure
```
blood_pressure_monitor/
├── frontend/           # Frontend files (HTML/CSS/JS)
│   ├── index.html
│   └── src/
│       └── app.js
├── backend/           # Go application
│   ├── cmd/
│   ├── internal/
│   │   ├── database/
│   │   ├── handlers/
│   │   └── models/
│   ├── pkg/
│   └── go.mod
├── database/          # SQLite database file
├── config/           # Configuration files
├── scripts/          # Deployment scripts
└── QUICK_START.md    # This file
```

## Getting Started
1. Install Go (1.21+) on your system
2. Clone the repository
3. Navigate to `backend` directory and run `go mod tidy`
4. Build the backend with `go build -o blood_pressure_monitor.exe cmd/main.go`
5. Run the Go backend server with `go run cmd/main.go` or `./blood_pressure_monitor.exe`
6. Open `frontend/index.html` in a browser to access the frontend

## Project Components
- **Backend**: Go server with REST API using Gorilla Mux and SQLite
- **Frontend**: Pure HTML/CSS/JavaScript (Vanilla JS) for responsive UI
- **Database**: SQLite for data persistence
- **Authentication**: Basic username/password system

## Running Locally
Start backend:
```bash
cd backend
go run cmd/main.go
```

The application will run on http://localhost:8080 for both frontend and backend.

## Deployment to Raspberry Pi

### Required Files to Copy:
1. `blood_pressure_monitor.exe` (or compiled binary for ARM)
2. `frontend/` directory 
3. `database/blood_pressure.db` file (will be created automatically on first run)

### Deployment Steps:
1. **Prepare Raspberry Pi**:
   ```bash
   # Install Go for ARM64 (Raspberry Pi OS)
   wget https://go.dev/dl/go1.21.5.linux-arm64.tar.gz
   sudo tar -C /usr/local -xzf go1.21.5.linux-arm64.tar.gz
   export PATH=$PATH:/usr/local/go/bin
   ```

2. **Copy Application Files**:
   ```bash
   # From your PC to Raspberry Pi
   scp blood_pressure_monitor pi@raspberrypi.local:~/blood_pressure_monitor/
   scp -r frontend pi@raspberrypi.local:~/blood_pressure_monitor/
   scp database/blood_pressure.db pi@raspberrypi.local:~/blood_pressure_monitor/database/
   ```

3. **Make Executable and Run**:
   ```bash
   ssh pi@raspberrypi.local
   cd blood_pressure_monitor
   chmod +x blood_pressure_monitor
   ./blood_pressure_monitor
   ```

4. **Configure Firewall**:
   ```bash
   sudo ufw allow 8080/tcp
   ```

### Cross-compilation for Raspberry Pi:
```bash
# From your development machine
cd backend/cmd
GOOS=linux GOARCH=arm64 go build -o ../blood_pressure_monitor
```

The application will be accessible at `http://raspberrypi-ip:8080` with all features including the interactive 7-day chart with zoom, pan, hover tooltips, and fullscreen mode.
