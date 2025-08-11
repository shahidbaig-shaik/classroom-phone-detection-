@echo off
echo ========================================
echo    Phone Detection System
echo ========================================
echo.
echo Starting the phone detection server...
echo.

REM Check if server is already running
curl -s http://localhost:8000/ >nul 2>&1
if %errorlevel% == 0 (
    echo Server is already running at http://localhost:8000/
    echo.
    echo Opening the web interface...
    start "" "phone_detection_ui\index.html"
    echo.
    echo System is ready! 
    echo - Server: http://localhost:8000/
    echo - Web UI: phone_detection_ui\index.html
    pause
    exit /b
)

REM Start the server
echo Installing dependencies...
.venv\Scripts\python.exe -m pip install -r vision_server\requirements.txt

echo.
echo Starting server...
cd vision_server
.venv\Scripts\python.exe phone_detection.py

pause
