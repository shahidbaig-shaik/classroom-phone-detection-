# Vision Demo - Concept Composition Framework

This project demonstrates a concept-driven application framework with computer vision capabilities for phone detection.

## Quick Start

### 1. Start the Next.js App
```bash
npm run dev
```
The app will be available at http://localhost:3000

### 2. Start the Vision Server
In a new terminal, run:
```bash
python run_vision_server.py
```
Or manually:
```bash
pip install -r vision_server/requirements.txt
python -m uvicorn vision_server.fastapi_app:app --port 8787 --reload
```

The vision server will be available at http://localhost:8787

### 3. Test the Demo
- Open http://localhost:3000 in your browser
- Click on "Vision Demo - Phone Detection"
- Allow camera access when prompted
- The demo will show real-time phone detection

## Project Structure

```
concept-composition-framework/
├── app/                          # Next.js app
│   ├── api/                     # API routes
│   │   ├── health/             # Health check
│   │   └── vision/frame/       # Vision processing
│   ├── demo/vision/            # Vision demo page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── concepts/                    # Concept implementations
│   └── vision.phoneuse.ts      # Phone detection concept
├── specs/                       # Concept specifications
│   └── vision.phoneuse.json    # Vision concept spec
├── syncs/                       # Synchronization rules
│   └── attention.sync.ts       # Attention monitoring
├── vision_server/               # Python vision server
│   ├── fastapi_app.py          # FastAPI server
│   └── requirements.txt        # Python dependencies
└── .env.local                  # Environment variables
```

## Concepts

### Vision.PhoneUse
- **Purpose**: Detect phones from video frames using local YOLO server
- **Inputs**: imageBase64, minConfidence, framesThreshold
- **Outputs**: isUsingPhone, detections, ts
- **State**: Tracks consecutive frames with phone detection

### Policy.Attention
- **Purpose**: Monitor sustained phone use
- **Trigger**: When phone detection meets threshold
- **Action**: Logs alert for sustained phone use

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/vision/frame` - Process video frame for phone detection

## Environment Variables

- `VISION_URL` - URL of the local vision server (default: http://localhost:8787/vision/frame)

## Development

### Adding New Concepts
1. Create concept specification in `specs/`
2. Implement concept in `concepts/`
3. Create synchronization rules in `syncs/`
4. Add API endpoints in `app/api/`

### Vision Server Customization
- Uncomment YOLO model loading in `vision_server/fastapi_app.py`
- Install ultralytics: `pip install ultralytics`
- Download YOLO model: `yolov8n.pt`

## Troubleshooting

- **Camera not working**: Ensure HTTPS or localhost, check browser permissions
- **Vision server error**: Check if Python packages are installed correctly
- **Build errors**: Ensure all dependencies are installed with `npm install`
