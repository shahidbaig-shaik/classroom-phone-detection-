# Phone Detection System

A local, offline MVP for classroom phone-use detection built with FastAPI and OpenCV.

## 🚀 Quick Start

### 1. Start the Server
The server is already running at `http://localhost:8000/`

### 2. Open the Web UI
Open `phone_detection_ui/index.html` in your web browser

### 3. Test the System
- Click "🧪 Test Detection" to test with mock data
- Click "📹 Start Camera" to use your webcam
- Click "▶️ Start Detection" to begin real-time detection

## 📁 File Structure

```
concept-composition-framework/
├── vision_server/
│   ├── phone_detection.py      # FastAPI server with phone detection
│   └── requirements.txt        # Python dependencies
├── phone_detection_ui/
│   └── index.html             # Web-based user interface
└── README_PHONE_DETECTION.md  # This file
```

## 🔧 How It Works

### Detection Method
- **Primary**: Uses OpenCV Haar cascades to detect faces and eyes
- **Fallback**: Detects head-down posture when eyes are not visible
- **Filtering**: Ignores tiny detections (< 0.3% of frame area)

### State Tracking
- Tracks consecutive positive frames (streak)
- Default threshold: 8 frames
- Generates alerts when threshold is met

### API Endpoints
- `GET /` - Web interface and server status
- `POST /detect` - Process frame and detect phones
- `GET /status` - Current detection status
- `GET /config` - Configuration settings

## 🎯 Features

- ✅ Real-time camera feed
- ✅ Phone use detection with fallback heuristics
- ✅ Streak tracking and threshold alerts
- ✅ Performance metrics (FPS, latency)
- ✅ Detection bounding boxes overlay
- ✅ Live status updates
- ✅ Test mode with mock data

## 🛠️ Configuration

Default settings in `phone_detection.py`:
```python
CONFIG = {
    "min_confidence": 0.65,        # Minimum confidence for detection
    "frames_threshold": 8,          # Frames needed to trigger alert
    "min_area_ratio": 0.003,       # Minimum detection area ratio
    "fallback_mode": True           # Use fallback heuristics
}
```

## 🔍 Troubleshooting

### Server Not Starting
1. Check if Python is installed: `python --version`
2. Install dependencies: `pip install -r vision_server/requirements.txt`
3. Run manually: `python vision_server/phone_detection.py`

### Camera Not Working
1. Ensure browser has camera permissions
2. Check if camera is being used by another application
3. Try refreshing the page

### Detection Issues
1. Ensure good lighting conditions
2. Face should be clearly visible
3. Check console for error messages

## 📊 Expected Behavior

1. **No Detection**: Status shows "✅ No Phone", streak = 0
2. **Phone Detected**: Status shows "📱 Phone Detected", streak increases
3. **Threshold Met**: After 8 consecutive detections, alert is generated
4. **Console Output**: `[ALERT] Sustained phone use detected! Streak: 8`

## 🌐 Access Points

- **Server**: http://localhost:8000/
- **Web UI**: Open `phone_detection_ui/index.html` in browser
- **API**: http://localhost:8000/detect (POST), http://localhost:8000/status (GET)

## 🔒 Security Notes

- Server runs on localhost only
- CORS enabled for local development
- No authentication required (local MVP)

## 📈 Performance

- **Frame Rate**: Target 10 FPS (100ms intervals)
- **Latency**: < 100ms per frame
- **Memory**: Minimal overhead, in-memory state tracking

## 🚧 Limitations (MVP)

- Fallback heuristics only (no pre-trained phone model)
- Basic face/eye detection
- No persistent storage
- Single machine only

## 🔮 Future Enhancements

- Pre-trained phone detection model
- ROI masking
- Configuration file support
- Database persistence
- Multi-camera support


