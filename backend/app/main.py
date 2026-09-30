import os
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from typing import List, Optional

from app.models.schemas import (
    TaskRequest,
    IngestedFile,
    AdvisorResponse,
)
from app.advisor.recommender import AIAdvisorEngine
from app.advisor.tools_catalog import AI_TOOLS_CATALOG
from app.orchestrator import OmniOrchestrator

app = FastAPI(
    title="Omni Agent API",
    description="Universal Multi-Agent Orchestration & AI Decision Engine",
    version="1.0.0"
)

# Enable CORS for local dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

advisor_engine = AIAdvisorEngine()
orchestrator = OmniOrchestrator()

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "system": "Omni Agent Core Engine",
        "python_version": "3.12",
        "jev_system1_router": "online",
        "common_context_engine": "ready"
    }

@app.get("/api/catalog")
async def get_tools_catalog():
    return {
        "total_tools": len(AI_TOOLS_CATALOG),
        "catalog": AI_TOOLS_CATALOG
    }

@app.post("/api/advisor/suggest", response_model=AdvisorResponse)
async def get_ai_advice(payload: dict):
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    response = advisor_engine.advise(prompt)
    return response

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        preview = contents[:2000].decode("utf-8", errors="ignore")
    except Exception:
        preview = f"[Binary data: {len(contents)} bytes]"

    return IngestedFile(
        filename=file.filename or "uploaded_file",
        content_type=file.content_type or "application/octet-stream",
        size_bytes=len(contents),
        preview_or_content=preview
    )

@app.post("/api/execute")
async def execute_task(request: TaskRequest):
    if not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Task prompt cannot be empty")

    return StreamingResponse(
        orchestrator.execute_stream(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

# Static Frontend Mount (if built)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DIST_DIR = BASE_DIR / "frontend" / "dist"

if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Allow API paths to fall through
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
