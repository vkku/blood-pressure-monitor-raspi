@echo off
echo Starting Blood Pressure Monitor...

REM Check if Go binary exists
if not exist "backend\blood_pressure_monitor.exe" (
    echo Backend binary not found. Running build first...
    call scripts\build.bat
)

REM Start the backend server
cd backend
blood_pressure_monitor.exe
