<<<<<<< HEAD
# Blood Pressure Monitor

A lightweight, mobile-compatible web application for blood pressure monitoring, designed to run on Raspberry Pi with minimal resource usage.

## Features

- 📊 **Daily Trends**: Visualize your blood pressure trends with easy-to-read charts
- 🔔 **Smart Alerts**: Get notified about high/low blood pressure and irregular heart rates
- 👥 **Family Sharing**: Multiple user profiles with shared data view for your family
- 📱 **Mobile Friendly**: Responsive design that works perfectly on all devices
- 🌙 **Dark Mode**: Easy on the eyes with built-in dark mode support
- 🎤 **Voice Input**: Hands-free data entry (coming soon)
- 📤 **Data Export**: Export readings to CSV for sharing with healthcare providers

## Tech Stack

### Frontend
- **Svelte**: Lightweight framework for fast, responsive UI
- **Vite**: Fast build tool and development server
- **Chart.js**: Data visualization library

### Backend
- **Go**: High-performance, low-memory backend
- **SQLite**: File-based database with no separate server
- **Gorilla Mux**: HTTP router for REST API

## System Requirements

- **Raspberry Pi 3** (or higher)
- **RAM**: < 100MB total usage
- **Storage**: ~100MB for application and database
- **Network**: Local network access

## Installation

### Prerequisites

- Go 1.21 or higher
- Node.js 18 or higher
- npm 9 or higher

### Quick Start

#### Windows
```cmd
scripts\build.bat
scripts\start.bat
```

#### Linux/Mac
```bash
chmod +x scripts/build.sh scripts/start.sh
./scripts/build.sh
./scripts/start.sh
```

### Manual Build

#### Build Frontend
```bash
cd frontend
npm install
npm run build
```

#### Build Backend
```bash
cd backend
go build -o blood_pressure_monitor ./cmd/main.go
```

## Usage

1. **Start the server**: Run the start script or execute the backend binary
2. **Access the app**: Open your browser and navigate to `http://localhost:8080`
3. **Register**: Create your first user account
4. **Add readings**: Record your blood pressure measurements
5. **View trends**: Check your daily and weekly statistics

## API Endpoints

### Health Check
- `GET /api/health` - Check if server is running

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user

### Readings
- `GET /api/users/{id}/readings` - Get readings for a user
- `POST /api/users/{id}/readings` - Create new reading
- `GET /api/users/{id}/readings/daily-trends` - Get 7-day trends
- `GET /api/users/{id}/readings/weekly-summary` - Get weekly statistics
- `GET /api/users/{id}/readings/export` - Export readings to CSV

### Alerts
- `GET /api/users/{id}/alerts` - Get alerts for a user
- `PUT /api/users/{id}/alerts/{id}/read` - Mark alert as read

## Project Structure

```
blood_pressure_monitor/
├── frontend/           # Svelte application
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── routes/     # Page routes
│   │   ├── stores/     # Svelte stores for state
│   │   └── lib/        # Utility functions
│   └── package.json
├── backend/           # Go application
│   ├── cmd/
│   │   └── main.go    # Application entry point
│   ├── internal/
│   │   ├── database/  # Database connection
│   │   ├── handlers/  # HTTP handlers
│   │   └── models/    # Data models
│   └── go.mod
├── database/          # SQLite database
├── config/           # Configuration files
├── scripts/          # Build and deployment scripts
└── README.md
```

## Performance

- **Frontend**: ~50MB (Svelte build + assets)
- **Backend**: ~20MB (Go binary + SQLite)
- **Database**: Variable based on data volume
- **Total RAM**: Target < 100MB

## Security

- Password-protected user accounts
- Local data storage only (no cloud sync)
- HTTPS support for production deployment
- Input validation on all API endpoints

## Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
go run cmd/main.go
```

## Deployment on Raspberry Pi

1. Copy the project to your Raspberry Pi
2. Run the build script: `./scripts/build.sh`
3. Start the server: `./scripts/start.sh`
4. Access from any device on your local network

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with Svelte, Vite, and Go
- Designed for Raspberry Pi and low-resource environments
- Family-focused blood pressure monitoring solution