"""
Omni Agent Application Launcher
Runs the complete fullstack application on Python 3.12 at http://localhost:8000
"""

import sys
import os
import socket
import argparse
from pathlib import Path
import subprocess

def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0

def find_available_port(preferred_port: int = 8000) -> int:
    port = preferred_port
    while port < 65535:
        if not is_port_in_use(port):
            return port
        port += 1
    return preferred_port

def main():
    parser = argparse.ArgumentParser(description="Omni Agent Application Launcher")
    parser.add_argument("--port", type=int, default=None, help="Port to bind the server")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host interface")
    args = parser.parse_args()

    root_dir = Path(__file__).resolve().parent
    venv_python = root_dir / "venv" / "Scripts" / "python.exe"

    if not venv_python.exists():
        print(f"Error: Python 3.12 venv not found at {venv_python}")
        print("Please create it using: py -3.12 -m venv venv")
        sys.exit(1)

    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    if args.port is not None:
        port = args.port
    else:
        port = find_available_port(8000)
        if port != 8000:
            print(f"[!] Note: Port 8000 is in use by another application. Auto-binding to port {port}.")

    display_host = "localhost" if args.host == "0.0.0.0" else args.host

    print("=" * 60)
    print(">> LAUNCHING OMNI AGENT (PYTHON 3.12 + JEV ROUTING CORE)")
    print("=" * 60)
    print(f" * Web UI & API Gateway: http://{display_host}:{port}")
    print(f" * Interactive Swagger:  http://{display_host}:{port}/docs")
    print(" * System 1 Router:      Jev Engine Online (jev-1.13-free)")
    print(" * Dedicated Reviewer:   Google Gemini 2.0 Flash (Multimodal & QA)")
    print(" * Memory Core:          Common Context Blackboard Active")
    print("=" * 60)

    backend_dir = root_dir / "backend"
    cmd = [
        str(venv_python),
        "-m", "uvicorn",
        "app.main:app",
        "--host", args.host,
        "--port", str(port),
        "--reload"
    ]

    try:
        subprocess.run(cmd, cwd=str(backend_dir))
    except KeyboardInterrupt:
        print("\nOmni Agent server stopped gracefully.")

if __name__ == "__main__":
    main()
