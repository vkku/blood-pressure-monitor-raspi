@echo off
echo Testing Blood Pressure Monitor API...
echo.
echo Testing health endpoint...
curl -s http://localhost:8080/api/health
echo.
echo.
echo Testing users endpoint...
curl -s http://localhost:8080/api/users
echo.
pause
