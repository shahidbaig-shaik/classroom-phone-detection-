#!/usr/bin/env python3
"""
Vision Server Runner
Run this script to start the FastAPI vision server
"""

import subprocess
import sys
import os

def install_requirements():
    """Install required packages"""
    print("Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "vision_server/requirements.txt"])
        print("Packages installed successfully!")
    except subprocess.CalledProcessError:
        print("Failed to install packages. Please install manually:")
        print("pip install -r vision_server/requirements.txt")
        return False
    return True

def run_server():
    """Run the FastAPI server"""
    print("Starting Vision Server on http://localhost:8787")
    print("Press Ctrl+C to stop the server")
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "vision_server.fastapi_app:app", 
            "--port", "8787", 
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\nVision Server stopped.")
    except Exception as e:
        print(f"Error running server: {e}")

if __name__ == "__main__":
    if install_requirements():
        run_server()
    else:
        print("Please install the required packages manually and try again.")
