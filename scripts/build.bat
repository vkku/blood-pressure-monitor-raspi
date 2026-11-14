@echo off
echo Building Blood Pressure Monitor...

REM Build the Svelte frontend
cd frontend
call npm install
call npm run build
cd ..

REM Build the Go backend
cd backend
go build -o blood_pressure_monitor.exe ./cmd/main.go
cd ..

echo.
echo Build completed successfully!
echo Frontend: frontend\public
echo Backend: backend\blood_pressure_monitor.exe
pause
