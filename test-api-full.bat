@echo off
echo Testing Blood Pressure Monitor API...
echo.
echo Testing user registration...
curl -s -X POST http://localhost:8080/api/users -H "Content-Type: application/json" -d "{\"name\":\"Test User\",\"username\":\"testuser\",\"password\":\"test123\"}"
echo.
echo.
echo Testing login with existing user...
curl -s http://localhost:8080/api/users
echo.
pause
