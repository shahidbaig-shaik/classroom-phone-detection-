"use client";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";

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
  sessionStartTime: number;
}

export default function PhoneDetectionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [isUsingPhone, setIsUsingPhone] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stats, setStats] = useState<DetectionStats>({
    totalDetections: 0,
    averageConfidence: 0,
    phoneUseTime: 0,
    lastDetection: 0,
    sessionStartTime: 0
  });
  const [settings, setSettings] = useState({
    minConfidence: 0.7,
    detectionInterval: 300,
    showBoundingBoxes: true,
    showStats: true,
    enableAlerts: true
  });
  const [phoneUseStartTime, setPhoneUseStartTime] = useState<number | null>(null);
  const [alertHistory, setAlertHistory] = useState<Array<{time: number, confidence: number}>>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set client-specific values after mounting
    setIsMounted(true);
    setStats(prev => ({ ...prev, sessionStartTime: Date.now() }));
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isMounted]);

  const startCamera = async () => {
    if (!isMounted) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640,
          height: 480,
          facingMode: 'user'
        } 
      });
      if (videoRef.current && isMounted) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject && isMounted) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  const togglePause = () => {
    if (isMounted) {
      setIsPaused(!isPaused);
    }
  };

  useEffect(() => {
    if (isPaused || !isMounted) return;

    let timeoutId: NodeJS.Timeout;
    let detectionCount = 0;
    let totalConfidence = 0;

    const detectionLoop = async () => {
      if (!isMounted || !videoRef.current || !canvasRef.current || !overlayRef.current || videoRef.current.readyState < 2) {
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
          if (isMounted) {
            setIsUsingPhone(true);
            if (phoneUseStartTime === null) {
              setPhoneUseStartTime(Date.now());
            }
            detectionCount++;
            totalConfidence += result.detections?.[0]?.confidence || 0;

            // Add to alert history
            if (settings.enableAlerts) {
              setAlertHistory(prev => [...prev.slice(-9), {
                time: Date.now(),
                confidence: result.detections?.[0]?.confidence || 0
              }]);
            }
          }
        } else {
          if (isMounted) {
            setIsUsingPhone(false);
            if (phoneUseStartTime !== null) {
              setPhoneUseStartTime(null);
            }
          }
        }

        if (isMounted) {
          setDetections(result.detections || []);
          
          // Update stats
          if (result.detections && result.detections.length > 0) {
            setStats(prev => ({
              ...prev,
              totalDetections: prev.totalDetections + 1,
              averageConfidence: (prev.averageConfidence * prev.totalDetections + result.detections[0].confidence) / (prev.totalDetections + 1),
              phoneUseTime: phoneUseStartTime ? Date.now() - phoneUseStartTime : 0,
              lastDetection: Date.now()
            }));
          }
        }

        // Draw bounding boxes
        if (settings.showBoundingBoxes && isMounted) {
          drawBoundingBoxes(result.detections || [], W, H);
        }

      } catch (error) {
        if (isMounted) {
          console.error('Detection error:', error);
        }
      }

      if (isMounted) {
        timeoutId = setTimeout(detectionLoop, settings.detectionInterval);
      }
    };

    detectionLoop();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [settings, phoneUseStartTime, isPaused, isMounted]);

  const drawBoundingBoxes = (detections: Detection[], width: number, height: number) => {
    if (!isMounted) return;
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
    if (!isMounted || ms <= 0) return '0s';
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

  const formatSessionTime = () => {
    if (!isMounted || stats.sessionStartTime === 0) return '0s';
    const sessionTime = Date.now() - stats.sessionStartTime;
    return formatTime(sessionTime);
  };

  const resetStats = () => {
    if (isMounted) {
      setStats(prev => ({
        totalDetections: 0,
        averageConfidence: 0,
        phoneUseTime: 0,
        lastDetection: 0,
        sessionStartTime: Date.now()
      }));
      setAlertHistory([]);
      setPhoneUseStartTime(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Home
            </Link>
            <div className="text-right text-sm text-gray-600">
              Session: {isMounted ? formatSessionTime() : '0s'}
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-3">📱 Phone Detection System</h1>
          <p className="text-xl text-gray-600">Real-time AI-powered detection of people using phones</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Camera View */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-semibold text-gray-800">Live Camera Feed</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={togglePause}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      isMounted && isPaused 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                  >
                    {isMounted && isPaused ? '▶ Resume' : '⏸ Pause'}
                  </button>
                  <button
                    onClick={resetStats}
                    className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    🔄 Reset Stats
                  </button>
                </div>
              </div>
              
              <div className="relative inline-block">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-w-3xl rounded-xl border-4 border-gray-300 shadow-lg"
                />
                <canvas
                  ref={overlayRef}
                  className="absolute top-0 left-0 w-full max-w-3xl pointer-events-none"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Phone Use Indicator */}
                {isUsingPhone && isMounted && (
                  <div className="absolute top-6 left-6 bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-xl phone-detection-alert shadow-lg">
                    🚨 PHONE DETECTED!
                  </div>
                )}
                
                {/* Stream Status */}
                <div className="absolute top-6 right-6">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
                    isMounted && isStreaming ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-red-100 text-red-800 border-2 border-red-300'
                  }`}>
                    {isMounted && isStreaming ? '🟢 LIVE STREAMING' : '🔴 OFFLINE'}
                  </div>
                </div>

                {/* Pause Overlay */}
                {isPaused && isMounted && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl">
                    <div className="bg-white p-8 rounded-xl text-center">
                      <div className="text-6xl mb-4">⏸️</div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Detection Paused</h3>
                      <p className="text-gray-600">Click Resume to continue monitoring</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Detection Stats */}
            {isMounted && settings.showStats && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">📊 Detection Statistics</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-800">{isMounted ? stats.totalDetections : 0}</div>
                    <div className="text-sm text-blue-600">Total Detections</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-800">{isMounted ? Math.round(stats.averageConfidence * 100) : 0}%</div>
                    <div className="text-sm text-green-600">Avg Confidence</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-800">{isMounted ? formatTime(stats.phoneUseTime) : '0s'}</div>
                    <div className="text-sm text-orange-600">Phone Use Time</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600">Last Detection</div>
                    <div className="text-lg font-semibold text-purple-800">
                      {stats.lastDetection && isMounted ? new Date(stats.lastDetection).toLocaleTimeString() : 'Never'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Current Detections */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">🎯 Current Detections</h3>
              {isMounted && detections.length > 0 ? (
                <div className="space-y-3">
                  {detections.map((detection, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-red-50 to-pink-50">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-semibold text-gray-800">Detection {index + 1}</span>
                        <span className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                          {isMounted ? Math.round(detection.confidence * 100) : 0}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex justify-between">
                          <span>Eyes:</span>
                          <span className="font-medium">{detection.eye_visibility}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Orientation:</span>
                          <span className="font-medium">{detection.orientation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Method:</span>
                          <span className="font-medium">{detection.method}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p className="text-gray-500">{isMounted ? 'No phone use detected' : 'Initializing...'}</p>
                </div>
              )}
            </div>

            {/* Alert History */}
            {isMounted && settings.enableAlerts && alertHistory.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">🚨 Recent Alerts</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {alertHistory.slice().reverse().map((alert, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                      <span className="text-sm text-gray-600">
                        {isMounted ? new Date(alert.time).toLocaleTimeString() : '--:--:--'}
                      </span>
                      <span className="text-sm font-medium text-red-700">
                        {isMounted ? Math.round(alert.confidence * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">⚙️ Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Confidence: {isMounted ? Math.round(settings.minConfidence * 100) : 70}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={isMounted ? settings.minConfidence : 0.7}
                    onChange={(e) => {
                      if (isMounted) {
                        setSettings(prev => ({ ...prev, minConfidence: parseFloat(e.target.value) }));
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detection Interval: {isMounted ? settings.detectionInterval : 300}ms
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="100"
                    value={isMounted ? settings.detectionInterval : 300}
                    onChange={(e) => {
                      if (isMounted) {
                        setSettings(prev => ({ ...prev, detectionInterval: parseInt(e.target.value) }));
                      }
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showBoundingBoxes"
                      checked={isMounted ? settings.showBoundingBoxes : true}
                      onChange={(e) => {
                        if (isMounted) {
                          setSettings(prev => ({ ...prev, showBoundingBoxes: e.target.checked }));
                        }
                      }}
                      className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="showBoundingBoxes" className="text-sm text-gray-700">
                      Show Bounding Boxes
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showStats"
                      checked={isMounted ? settings.showStats : true}
                      onChange={(e) => {
                        if (isMounted) {
                          setSettings(prev => ({ ...prev, showStats: e.target.checked }));
                        }
                      }}
                      className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="showStats" className="text-sm text-gray-700">
                      Show Statistics
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enableAlerts"
                      checked={isMounted ? settings.enableAlerts : true}
                      onChange={(e) => {
                        if (isMounted) {
                          setSettings(prev => ({ ...prev, enableAlerts: e.target.checked }));
                        }
                      }}
                      className="mr-3 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="enableAlerts" className="text-sm text-gray-700">
                      Enable Alerts
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
