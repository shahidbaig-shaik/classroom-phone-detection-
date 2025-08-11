@echo off
echo Installing Python dependencies...
pip install -r vision_server/requirements.txt

echo Starting Vision Server...
python vision_server/fastapi_app.py

echo Vision Server stopped.
pause
