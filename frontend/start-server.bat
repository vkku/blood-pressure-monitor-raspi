@echo off
echo Starting simple HTTP server for Blood Pressure Monitor...
echo.
echo Frontend will be available at: http://localhost:8000
echo Backend API is at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.
cd /d %~dp0
python -m http.server 8000
pause
