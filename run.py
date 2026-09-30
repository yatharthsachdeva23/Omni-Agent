"""
Omni Agent Application Launcher
Runs the complete fullstack application on Python 3.12 at http://localhost:8000
"""

import sys
import os
from pathlib import Path
import subprocess

def main():
    root_dir = Path(__file__).resolve().parent
    venv_python = root_dir / "venv" / "Scripts" / "python.exe"

    if not venv_python.exists():
        print(f"Error: Python 3.12 venv not found at {venv_python}")
        print("Please create it using: py -3.12 -m venv venv")
        sys.exit(1)

    print("=" * 60)
    print("🚀 LAUNCHING OMNI AGENT (PYTHON 3.12 + JEV ROUTING CORE)")
    print("=" * 60)
    print("• Web UI & API Gateway: http://localhost:8000")
    print("• System 1 Router:      Jev Engine Online")
    print("• Memory Core:          Common Context Blackboard Active")
    print("=" * 60)

    backend_dir = root_dir / "backend"
    cmd = [
        str(venv_python),
        "-m", "uvicorn",
        "app.main:app",
        "--host", "0.0.0.0",
        "--port", "8000",
        "--reload"
    ]

    try:
        subprocess.run(cmd, cwd=str(backend_dir))
    except KeyboardInterrupt:
        print("\nOmni Agent server stopped gracefully.")

if __name__ == "__main__":
    main()
