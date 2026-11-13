import subprocess
import threading
import webbrowser
import time
import os

def run_backend():
    subprocess.call(["python", "app.py"])

def run_frontend():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    subprocess.call(["python", "-m", "http.server", "5500"])

def open_browser():
    time.sleep(3)
    webbrowser.open("http://127.0.0.1:5500/index.html")

# Start backend and frontend servers in separate threads
threading.Thread(target=run_backend, daemon=True).start()
threading.Thread(target=run_frontend, daemon=True).start()

# Open browser
open_browser()

# Keep main thread alive so servers don't close
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n Servers stopped by user.")
