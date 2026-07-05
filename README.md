# Classroom Phone Detection

![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python) ![OpenCV](https://img.shields.io/badge/OpenCV-4.x-5C3EE8?logo=opencv) ![Computer Vision](https://img.shields.io/badge/CV-Object%20Detection-brightgreen) ![License](https://img.shields.io/badge/license-MIT-green)

> Computer vision pipeline that detects mobile phone usage in classroom environments in real time.

## Overview

Phone distraction in academic settings negatively impacts learning outcomes. This system applies object detection to video frames captured by a classroom camera, identifies mobile phones in students' hands or on desks, and flags instances for instructor review — enabling data-driven enforcement without manual monitoring.

## Tech Stack

| Component | Technology |
|---|---|
| Object Detection | Pre-trained detection model (YOLO / SSD) |
| Vision Processing | OpenCV |
| App Layer | Streamlit (in `/app`) |
| Concepts & Docs | `/concepts` directory |
| Language | Python 3.10+ |

## How It Works

- **Capture** video frames from a camera feed or video file
- **Preprocess** frames (resize, normalize) for model inference
- **Detect** objects using a fine-tuned or pre-trained phone-class detector
- **Filter** detections by confidence threshold to reduce false positives
- **Output** annotated frames with bounding boxes and alert flags
- **Dashboard** (Streamlit) displays live feed with detection overlays

## Quick Start

```bash
git clone https://github.com/shahidbaig-shaik/classroom-phone-detection-
cd classroom-phone-detection-
pip install -r app/requirements.txt
python app/main.py --source 0          # webcam
python app/main.py --source video.mp4  # video file
```
