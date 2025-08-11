export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Concept Composition Framework</h1>
          <p className="text-xl text-gray-600">Welcome to the concept-driven application framework!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Phone Detection System */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="text-center">
              <div className="text-6xl mb-4">📱</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Phone Detection System</h2>
              <p className="text-gray-600 mb-6">
                Advanced AI-powered system to detect when people are using phones in real-time.
                Features include face detection, eye visibility analysis, and comprehensive statistics.
              </p>
              <a 
                href="/phone-detection" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Launch Phone Detection
              </a>
            </div>
          </div>

          {/* Vision Demo */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow">
            <div className="text-center">
              <div className="text-6xl mb-4">👁️</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Vision Demo</h2>
              <p className="text-gray-600 mb-6">
                Basic vision detection demo with camera feed and real-time analysis.
                Simple interface for testing the vision API.
              </p>
              <a 
                href="/demo/vision" 
                className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Launch Vision Demo
              </a>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Real-time Detection</h3>
              <p className="text-gray-600">Instant detection of phone use with live camera feed</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Advanced Analytics</h3>
              <p className="text-gray-600">Comprehensive statistics and detection history</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Customizable Settings</h3>
              <p className="text-gray-600">Adjustable confidence thresholds and detection intervals</p>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mt-16 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600 mb-2">Next.js</div>
              <p className="text-sm text-gray-600">React Framework</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 mb-2">FastAPI</div>
              <p className="text-sm text-gray-600">Python Backend</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600 mb-2">OpenCV</div>
              <p className="text-sm text-gray-600">Computer Vision</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600 mb-2">Tailwind CSS</div>
              <p className="text-sm text-gray-600">Styling Framework</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
