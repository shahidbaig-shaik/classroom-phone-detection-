from fastapi import FastAPI
from pydantic import BaseModel
import base64, cv2, numpy as np, time

app = FastAPI()

class Frame(BaseModel):
    imageBase64: str
    minConfidence: float = 0.6

def detect_faces_without_visible_eyes(image, min_confidence=0.6):
    """Detect faces where eyes are not visible (indicating phone use)"""
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Load face and eye cascade classifiers
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        
        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30),
            flags=cv2.CASCADE_SCALE_IMAGE
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
            
            # Analyze eye visibility and face orientation
            eye_visibility_score = analyze_eye_visibility(face_roi, eyes, w, h)
            orientation_score = analyze_face_orientation(face_roi)
            
            # Combine scores - prioritize faces without visible eyes
            combined_score = (eye_visibility_score * 0.7) + (orientation_score * 0.3)
            
            # Check if face meets criteria for phone use detection
            if combined_score > 0.5:  # Threshold for detection
                confidence = calculate_face_confidence(face_roi, w, h, combined_score)
                
                if confidence >= min_confidence:
                    detections.append({
                        "class": "face_without_visible_eyes",
                        "confidence": float(confidence),
                        "bbox": {"x": float(x + w/2), "y": float(y + h/2), "w": float(w), "h": float(h)},
                        "eye_visibility": "not_visible" if eye_visibility_score > 0.6 else "partially_visible",
                        "orientation": "downward" if orientation_score > 0.5 else "neutral",
                        "method": "enhanced_eye_detection"
                    })
        
        return detections
        
    except Exception as e:
        print(f"Error in face detection: {e}")
        return []

def analyze_eye_visibility(face_roi, detected_eyes, face_w, face_h):
    """Analyze how visible the eyes are in the face region"""
    try:
        if face_roi.size == 0:
            return 0.0
        
        # If no eyes detected, this is a strong indicator of downward face
        if len(detected_eyes) == 0:
            return 0.9
        
        # If only one eye detected, still likely looking down
        if len(detected_eyes) == 1:
            return 0.7
        
        # If multiple eyes detected, analyze their quality and positioning
        if len(detected_eyes) >= 2:
            # Check if eyes are positioned correctly for a normal face
            eye_positions = []
            for (ex, ey, ew, eh) in detected_eyes:
                # Normalize eye positions relative to face
                norm_x = (ex + ew/2) / face_w
                norm_y = (ey + eh/2) / face_h
                eye_positions.append((norm_x, norm_y))
            
            # Eyes should be in the upper portion of the face
            # If eyes are too low, it might indicate the face is tilted down
            upper_eye_threshold = 0.4  # Eyes should be in upper 40% of face
            eyes_too_low = any(ey > upper_eye_threshold for _, ey in eye_positions)
            
            if eyes_too_low:
                return 0.6
            
            # Check eye size - very small eyes might indicate poor visibility
            small_eyes = any(ew < face_w * 0.15 or eh < face_h * 0.08 for ex, ey, ew, eh in detected_eyes)
            if small_eyes:
                return 0.5
            
            # If eyes are well-positioned and sized, reduce the score
            return 0.3
        
        return 0.0
        
    except Exception as e:
        print(f"Error in eye visibility analysis: {e}")
        return 0.0

def analyze_face_orientation(face_roi):
    """Analyze if a face is looking downward with enhanced detection"""
    try:
        if face_roi.size == 0:
            return 0.0
        
        # Convert to float for calculations
        face_float = face_roi.astype(np.float32)
        
        h, w = face_roi.shape
        
        # Method 1: Weighted center of mass analysis
        y_coords, x_coords = np.mgrid[0:h, 0:w]
        
        # Weight by intensity (darker regions are more important for face features)
        total_weight = np.sum(255 - face_float)
        if total_weight == 0:
            return 0.0
        
        # Calculate weighted center
        weighted_y = np.sum((255 - face_float) * y_coords) / total_weight
        weighted_x = np.sum((255 - face_float) * x_coords) / total_weight
        
        # Normalize to 0-1 range
        normalized_y = weighted_y / h
        normalized_x = weighted_x / w
        
        # A face looking downward will have features concentrated in the upper part
        # and the weighted center will be higher (lower y value in image coordinates)
        downward_score = 1.0 - normalized_y
        
        # Method 2: Regional variance analysis
        # Divide face into thirds vertically
        top_third = face_roi[:h//3, :]
        middle_third = face_roi[h//3:2*h//3, :]
        bottom_third = face_roi[2*h//3:, :]
        
        if top_third.size > 0 and middle_third.size > 0 and bottom_third.size > 0:
            top_variance = np.std(top_third)
            middle_variance = np.std(middle_third)
            bottom_variance = np.std(bottom_third)
            
            # If top third has more variation (more features visible), likely looking down
            if top_variance > middle_variance and top_variance > bottom_variance:
                downward_score += 0.3
            elif top_variance > bottom_variance:
                downward_score += 0.2
        
        # Method 3: Edge density analysis
        # Apply Sobel edge detection
        sobel_x = cv2.Sobel(face_roi, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(face_roi, cv2.CV_64F, 0, 1, ksize=3)
        edge_magnitude = np.sqrt(sobel_x**2 + sobel_y**2)
        
        # Check edge density in different regions
        top_half = edge_magnitude[:h//2, :]
        bottom_half = edge_magnitude[h//2:, :]
        
        if top_half.size > 0 and bottom_half.size > 0:
            top_edge_density = np.mean(top_half)
            bottom_edge_density = np.mean(bottom_half)
            
            # If top half has more edges (more facial features visible), likely looking down
            if top_edge_density > bottom_edge_density:
                downward_score += 0.2
        
        # Method 4: Histogram analysis
        # Check if the intensity distribution is skewed towards the top
        hist = cv2.calcHist([face_roi], [0], None, [256], [0, 256])
        hist = hist.flatten()
        
        # Calculate the center of mass of the histogram
        if np.sum(hist) > 0:
            hist_center = np.sum(np.arange(256) * hist) / np.sum(hist)
            # Lower intensity values (darker) are more common in downward faces
            if hist_center < 128:
                downward_score += 0.1
        
        return min(1.0, downward_score)
        
    except Exception as e:
        print(f"Error in orientation analysis: {e}")
        return 0.0

def calculate_face_confidence(face_roi, w, h, combined_score):
    """Calculate confidence for face detection with enhanced metrics"""
    try:
        if face_roi.size == 0:
            return 0.0
        
        # Size confidence - prefer medium-sized faces
        size_score = 1.0
        if w < 50 or h < 50:
            size_score = 0.4  # Reduced penalty for small faces
        elif w > 200 or h > 200:
            size_score = 0.8
        
        # Aspect ratio confidence - faces should be roughly square-ish
        aspect_ratio = h / w if w > 0 else 0
        aspect_score = 1.0 - abs(aspect_ratio - 1.0) / 0.8  # More lenient aspect ratio
        aspect_score = max(0.0, aspect_score)
        
        # Texture confidence - faces should have some texture variation
        std_dev = np.std(face_roi)
        texture_score = min(1.0, std_dev / 25.0)  # Lower threshold for texture
        
        # Combined score confidence - heavily weight the combined score
        combined_confidence = combined_score
        
        # Combine scores with combined score being the most important
        total_score = (combined_confidence * 0.7 + size_score * 0.1 + 
                      aspect_score * 0.1 + texture_score * 0.1)
        
        return min(0.95, total_score)
        
    except Exception as e:
        print(f"Error in confidence calculation: {e}")
        return 0.0

@app.post("/vision/frame")
def infer(f: Frame):
    try:
        header, b64 = f.imageBase64.split(",", 1) if "," in f.imageBase64 else ("", f.imageBase64)
        img = cv2.imdecode(np.frombuffer(base64.b64decode(b64), np.uint8), cv2.IMREAD_COLOR)
        
        if img is None:
            return {"error": "Invalid image data", "isUsingPhone": False, "detections": [], "ts": int(time.time() * 1000)}
        
        # Detect faces without visible eyes
        detections = detect_faces_without_visible_eyes(img, f.minConfidence)
        
        return {
            "isUsingPhone": len(detections) > 0, 
            "detections": detections, 
            "ts": int(time.time() * 1000)
        }
    except Exception as e:
        return {"error": str(e), "isUsingPhone": False, "detections": [], "ts": int(time.time() * 1000)}

@app.get("/")
def root():
    return {"message": "Vision Server Running", "endpoints": ["/vision/frame"]}
