# Blood Pressure Monitoring Web App - Project Plan

## 1. Core Requirements Summary

- **Purpose**: Mobile-compatible web app for blood pressure monitoring
- **Deployment**: Raspberry Pi 3 with media server already running
- **Performance**: Must be lightweight (< 100MB RAM usage)
- **Users**: Multiple family members with shared data view

## 2. Technical Architecture

### Frontend (Visually appealing, lightweight)
- **Framework**: Svelte (chosen for being very lightweight and visually appealing)
- **Key Features**:
  - Responsive design for mobile/desktop
  - Dark mode support
  - Touch-optimized interface
  - Fast loading (optimized for Raspberry Pi)

### Backend (Fast, low memory footprint)
- **Framework**: Go (chosen for speed and low memory usage)
- **Database**: SQLite (file-based, no separate server needed)
- **API**: RESTful API with Go standard library or lightweight router

## 3. User Management & Data Privacy

- **User Model**: Family members with simple profiles
- **Data View**: Shared view - all users can see everyone's data
- **Authentication**: Standard password protection
- **No complex login system** - simple profile selection

## 4. Data Tracking Features

### Required Data Points:
- Systolic pressure
- Diastolic pressure
- Heart rate
- Measurement time & date
- Notes
- Medication taken
- Body position
- Arm used
- Activity level

### Input Methods:
- Manual entry
- Voice input (for hands-free operation)

## 5. Visualization & Analytics

- Daily trends with line charts
- Weekly charts for pattern analysis
- Monthly overview with summary statistics
- Comparison charts between users
- Data export to CSV/PDF
- Print reports functionality

## 6. Alerts & Notifications

- High blood pressure alerts
- Low blood pressure alerts
- Irregular heart rate detection
- Missed measurement reminders
- Trend warnings for gradual changes

## 7. Deployment Considerations

- **Hardware**: Raspberry Pi 3 with limited RAM
- **Coexistence**: Must share resources with media server
- **Memory**: Target < 100MB RAM usage
- **Network**: Local network deployment with password protection

## 8. Security & Backup

- **Security**: Standard password protection
- **Backup**: Manual export functionality
- **No automatic cloud sync** (keeps data local)

## 9. Project Structure Proposal

```
blood_pressure_monitor/
├── frontend/           # Svelte application
│   ├── src/
│   │   ├── components/
│   │   ├── routes/
│   │   ├── stores/
│   │   └── lib/
│   └── package.json
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
└── README.md
```

## 10. Performance Optimizations

- **Frontend**: Svelte compiles to minimal JavaScript
- **Backend**: Go binary is small and memory-efficient
- **Database**: SQLite requires no separate process
- **Caching**: Implement client-side caching for charts
- **Lazy Loading**: Load charts only when needed
- **Compression**: Enable gzip for API responses

## 11. Development Phases

### Phase 1: Core Infrastructure
- Set up Go backend with SQLite
- Basic CRUD API for blood pressure readings
- Simple Svelte frontend with data entry form

### Phase 2: User Management & Visualization
- Family member profiles
- Basic charts (daily trends)
- Shared view implementation

### Phase 3: Advanced Features
- Voice input integration
- Advanced visualizations
- Alert system
- Export/print functionality

### Phase 4: Optimization & Polish
- Performance tuning for Raspberry Pi
- Mobile optimization
- Dark mode implementation
- Deployment scripts

## 12. Resource Estimates

- **Frontend**: ~50MB (Svelte build + assets)
- **Backend**: ~20MB (Go binary + SQLite)
- **Database**: Variable based on data volume
- **Total**: Target < 100MB RAM usage

## 13. Next Steps

1. Set up the project structure
2. Initialize Git repository
3. Create basic Go backend with SQLite
4. Set up Svelte frontend
5. Implement basic data entry and display
