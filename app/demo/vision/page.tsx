"use client";
import { useRef, useEffect, useState } from "react";

interface Detection {
  class: string;
  confidence: number;
  bbox: { x: number; y: number; w: number; h: number };
  eye_visibility: string;
  orientation: string;
  method: string;
}

interface DetectionStats {
  totalDetections: number;
  averageConfidence: number;
  phoneUseTime: number;
  lastDetection: number;
}

export default function DemoVision() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [isUsingPhone, setIsUsingPhone] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [stats, setStats] = useState<DetectionStats>({
    totalDetections: 0,
    averageConfidence: 0,
    phoneUseTime: 0,
    lastDetection: 0
  });
  const [settings, setSettings] = useState({
    minConfidence: 0.7,
    detectionInterval: 300,
    showBoundingBoxes: true,
    showStats: true
  });
  const [phoneUseStartTime, setPhoneUseStartTime] = useState<number | null>(null);

  useEffect(() => {
    startCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640,
          height: 480,
          facingMode: 'user'
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let detectionCount = 0;
    let totalConfidence = 0;

    const detectionLoop = async () => {
      if (!videoRef.current || !canvasRef.current || !overlayRef.current || videoRef.current.readyState < 2) {
        timeoutId = setTimeout(detectionLoop, 300);
        return;
      }

      const W = 640;
      const H = Math.round((videoRef.current.videoHeight / videoRef.current.videoWidth) * W);
      
      canvasRef.current.width = W;
      canvasRef.current.height = H;
      overlayRef.current.width = W;
      overlayRef.current.height = H;

      const ctx = canvasRef.current.getContext('2d')!;
      ctx.drawImage(videoRef.current, 0, 0, W, H);

      const imageBase64 = canvasRef.current.toDataURL('image/jpeg', 0.7);

      try {
        const response = await fetch('/api/vision/frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            minConfidence: settings.minConfidence
          })
        });

        const result = await response.json();
        
        if (result.isUsingPhone) {
          setIsUsingPhone(true);
          if (phoneUseStartTime === null) {
            setPhoneUseStartTime(Date.now());
          }
          detectionCount++;
          totalConfidence += result.detections?.[0]?.confidence || 0;
        } else {
          setIsUsingPhone(false);
          if (phoneUseStartTime !== null) {
            setPhoneUseStartTime(null);
          }
        }

        setDetections(result.detections || []);
        
        // Update stats
        if (result.detections && result.detections.length > 0) {
          setStats(prev => ({
            totalDetections: prev.totalDetections + 1,
            averageConfidence: (prev.averageConfidence * prev.totalDetections + result.detections[0].confidence) / (prev.totalDetections + 1),
            phoneUseTime: phoneUseStartTime ? Date.now() - phoneUseStartTime : 0,
            lastDetection: Date.now()
          }));
        }

        // Draw bounding boxes
        if (settings.showBoundingBoxes) {
          drawBoundingBoxes(result.detections || [], W, H);
        }

      } catch (error) {
        console.error('Detection error:', error);
      }

      timeoutId = setTimeout(detectionLoop, settings.detectionInterval);
    };

    detectionLoop();

    return () => clearTimeout(timeoutId);
  }, [settings, phoneUseStartTime]);

  const drawBoundingBoxes = (detections: Detection[], width: number, height: number) => {
    const overlayCtx = overlayRef.current?.getContext('2d');
    if (!overlayCtx) return;

    overlayCtx.clearRect(0, 0, width, height);

    detections.forEach((detection) => {
      const x1 = detection.bbox.x - detection.bbox.w / 2;
      const y1 = detection.bbox.y - detection.bbox.h / 2;

      // Draw bounding box
      overlayCtx.strokeStyle = '#ff0000';
      overlayCtx.lineWidth = 3;
      overlayCtx.strokeRect(x1, y1, detection.bbox.w, detection.bbox.h);

      // Draw label
      overlayCtx.fillStyle = '#ff0000';
      overlayCtx.font = '16px Arial';
      overlayCtx.fillText(
        `Phone Use: ${Math.round(detection.confidence * 100)}%`,
        x1,
        y1 - 10
      );

      // Draw additional info
      overlayCtx.font = '12px Arial';
      overlayCtx.fillText(
        `Eyes: ${detection.eye_visibility}`,
        x1,
        y1 + detection.bbox.h + 20
      );
      overlayCtx.fillText(
        `Orientation: ${detection.orientation}`,
        x1,
        y1 + detection.bbox.h + 35
      );
    });
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Phone Detection System</h1>
          <p className="text-gray-600">Real-time detection of people using phones</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Camera View */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Live Camera Feed</h2>
              <div className="relative inline-block">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-w-2xl rounded-lg border-2 border-gray-300"
                />
                <canvas
                  ref={overlayRef}
                  className="absolute top-0 left-0 w-full max-w-2xl pointer-events-none"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Phone Use Indicator */}
                {isUsingPhone && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg font-semibold text-lg animate-pulse">
                    📱 Phone Detected!
                  </div>
                )}
                
                {/* Stream Status */}
                <div className="absolute top-4 right-4">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isStreaming ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isStreaming ? '🟢 Live' : '🔴 Offline'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Detection Stats */}
            {settings.showStats && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">Detection Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Detections:</span>
                    <span className="font-semibold">{stats.totalDetections}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Confidence:</span>
                    <span className="font-semibold">{Math.round(stats.averageConfidence * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone Use Time:</span>
                    <span className="font-semibold">{formatTime(stats.phoneUseTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Detection:</span>
                    <span className="font-semibold">
                      {stats.lastDetection ? new Date(stats.lastDetection).toLocaleTimeString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Current Detections */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Current Detections</h3>
              {detections.length > 0 ? (
                <div className="space-y-3">
                  {detections.map((detection, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">Detection {index + 1}</span>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {Math.round(detection.confidence * 100)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>Eyes: {detection.eye_visibility}</div>
                        <div>Orientation: {detection.orientation}</div>
                        <div>Method: {detection.method}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No detections</p>
              )}
            </div>

            {/* Settings */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Confidence: {Math.round(settings.minConfidence * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={settings.minConfidence}
                    onChange={(e) => setSettings(prev => ({ ...prev, minConfidence: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detection Interval: {settings.detectionInterval}ms
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="100"
                    value={settings.detectionInterval}
                    onChange={(e) => setSettings(prev => ({ ...prev, detectionInterval: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showBoundingBoxes"
                    checked={settings.showBoundingBoxes}
                    onChange={(e) => setSettings(prev => ({ ...prev, showBoundingBoxes: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="showBoundingBoxes" className="text-sm text-gray-700">
                    Show Bounding Boxes
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showStats"
                    checked={settings.showStats}
                    onChange={(e) => setSettings(prev => ({ ...prev, showStats: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="showStats" className="text-sm text-gray-700">
                    Show Statistics
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
