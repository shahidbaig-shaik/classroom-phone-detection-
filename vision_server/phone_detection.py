from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import cv2
import numpy as np
import json
import time
from typing import List, Dict, Any
import os
from pathlib import Path
import base64

app = FastAPI(title="Phone Detection Vision Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
CONFIG = {
    "min_confidence": 0.65,
    "frames_threshold": 8,
    "min_area_ratio": 0.003,
    "fallback_mode": True  # Set to True to use fallback heuristics
}

# Global state for tracking
detection_history = []
current_streak = 0
last_alert_time = 0

class PhoneDetector:
    def __init__(self):
        self.fallback_mode = CONFIG["fallback_mode"]
        print("Phone detector initialized in fallback mode")
    
    def detect_phones_fallback(self, frame):
        """Fallback heuristic: detect head-down posture and no eyes"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # Load face and eye cascade classifiers
            face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
            eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
            
            # Detect faces
            faces = face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=4, 
                minSize=(30, 30)
            )
            
            detections = []
            
            for (x, y, w, h) in faces:
                # Get the face region
                face_roi = gray[y:y+h, x:x+w]
                
                # Detect eyes within the face region
                eyes = eye_cascade.detectMultiScale(
                    face_roi,
                    scaleFactor=1.1,
                    minNeighbors=3,
                    minSize=(15, 15),
                    maxSize=(w//3, h//3)
                )
                
                # If no eyes detected or only one eye, likely looking down at phone
                if len(eyes) <= 1:
                    confidence = 0.7 if len(eyes) == 0 else 0.6
                    
                    detections.append({
                        "class": "phone_use",
                        "confidence": confidence,
                        "bbox": {"x": x, "y": y, "w": w, "h": h}
                    })
            
            return detections
            
        except Exception as e:
            print(f"Fallback detection failed: {e}")
            return []
    
    def detect_phones(self, frame):
        """Main detection method"""
        if self.fallback_mode:
            return self.detect_phones_fallback(frame)
        else:
            # Placeholder for model-based detection
            return []

def filter_detections(detections: List[Dict], frame_area: int):
    """Filter out tiny detections"""
    min_area = frame_area * CONFIG["min_area_ratio"]
    filtered = []
    
    for det in detections:
        bbox = det["bbox"]
        area = bbox["w"] * bbox["h"]
        if area >= min_area:
            filtered.append(det)
    
    return filtered

@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint with simple HTML interface"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Phone Detection Server</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .status { padding: 20px; background: #f0f0f0; border-radius: 5px; margin: 20px 0; }
            .endpoint { background: #e8f4f8; padding: 10px; margin: 10px 0; border-radius: 3px; }
        </style>
    </head>
    <body>
        <h1>Phone Detection Vision Server</h1>
        <div class="status">
            <h2>Server Status: Running</h2>
            <p>Current Streak: <span id="streak">0</span></p>
            <p>Threshold Met: <span id="threshold">No</span></p>
        </div>
        
        <h2>Available Endpoints:</h2>
        <div class="endpoint">
            <strong>POST /detect</strong> - Process a frame and detect phone use
        </div>
        <div class="endpoint">
            <strong>GET /status</strong> - Get current detection status
        </div>
        <div class="endpoint">
            <strong>GET /config</strong> - Get current configuration
        </div>
        
        <h2>Test Detection:</h2>
        <button onclick="testDetection()">Test with Mock Frame</button>
        <div id="result"></div>
        
        <script>
            async function testDetection() {
                try {
                    const response = await fetch('/detect', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({test: true})
                    });
                    const data = await response.json();
                    document.getElementById('result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                } catch (error) {
                    document.getElementById('result').innerHTML = 'Error: ' + error.message;
                }
            }
            
            // Update status every 2 seconds
            setInterval(async () => {
                try {
                    const response = await fetch('/status');
                    const data = await response.json();
                    document.getElementById('streak').textContent = data.current_streak;
                    document.getElementById('threshold').textContent = data.meets_threshold ? 'Yes' : 'No';
                } catch (error) {
                    console.log('Status update failed:', error);
                }
            }, 2000);
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.post("/detect")
async def detect_phones(frame_data: Dict[str, Any]):
    """Detect phones in a frame"""
    global current_streak, last_alert_time
    
    try:
        # Check if this is a test request
        if frame_data.get("test"):
            # For demo purposes, create a mock frame
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            # Add some mock detections for testing
            detections = [
                {
                    "class": "phone",
                    "confidence": 0.8,
                    "bbox": {"x": 100, "y": 100, "w": 80, "h": 120}
                }
            ]
        else:
            # Use actual detection
            frame_bytes = base64.b64decode(frame_data["frame"])
            nparr = np.frombuffer(frame_bytes, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            detections = detector.detect_phones(frame)
        
        # Filter detections
        frame_area = frame.shape[0] * frame.shape[1]
        filtered_detections = filter_detections(detections, frame_area)
        
        # Determine if phone is being used
        is_using_phone = len(filtered_detections) > 0
        
        # Update streak
        if is_using_phone:
            current_streak += 1
        else:
            current_streak = 0
        
        # Check threshold
        meets_threshold = current_streak >= CONFIG["frames_threshold"]
        
        # Generate alert
        current_time = time.time()
        if meets_threshold and (current_time - last_alert_time) > 5:  # Prevent spam
            print(f"[ALERT] Sustained phone use detected! Streak: {current_streak}")
            last_alert_time = current_time
        
        # Store in history
        detection_history.append({
            "timestamp": current_time,
            "is_using_phone": is_using_phone,
            "streak": current_streak,
            "meets_threshold": meets_threshold
        })
        
        # Keep only last 100 entries
        if len(detection_history) > 100:
            detection_history.pop(0)
        
        # Return result in required format
        result = {
            "isUsingPhone": is_using_phone,
            "detections": filtered_detections,
            "ts": int(current_time * 1000)  # Convert to milliseconds
        }
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.get("/status")
async def get_status():
    """Get current detection status"""
    return {
        "current_streak": current_streak,
        "meets_threshold": current_streak >= CONFIG["frames_threshold"],
        "is_on_phone": current_streak > 0,
        "last_alert": last_alert_time,
        "detection_history_count": len(detection_history)
    }

@app.get("/config")
async def get_config():
    """Get current configuration"""
    return CONFIG

@app.post("/config")
async def update_config(new_config: Dict[str, Any]):
    """Update configuration"""
    global CONFIG
    for key, value in new_config.items():
        if key in CONFIG:
            CONFIG[key] = value
    
    # Reload detector if fallback mode changed
    if "fallback_mode" in new_config:
        detector.fallback_mode = CONFIG["fallback_mode"]
    
    return {"message": "Configuration updated", "config": CONFIG}

# Initialize detector
detector = PhoneDetector()

if __name__ == "__main__":
    import uvicorn
    print("Starting Phone Detection Vision Server...")
    print("Fallback mode:", detector.fallback_mode)
    print("Server will be available at: http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
