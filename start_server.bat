@echo off
echo Starting Phone Detection Server...
echo.
echo Installing dependencies...
python -m pip install -r vision_server/requirements.txt
echo.
echo Starting server...
cd vision_server
python phone_detection.py
pause
