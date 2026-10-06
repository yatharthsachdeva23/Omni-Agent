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
    InteractivePlanResponse,
)
from app.advisor.recommender import AIAdvisorEngine
from app.advisor.tools_catalog import AI_TOOLS_CATALOG
from app.orchestrator import OmniOrchestrator
from app.core.interactive_planner import InteractivePlannerAgent

app = FastAPI(
    title="OmniTask AI API",
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
interactive_planner = InteractivePlannerAgent()

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "system": "OmniTask AI Core Engine",
        "python_version": "3.12",
        "jev_system1_router": "online",
        "common_context_engine": "ready",
        "ask_before_doing": "online"
    }

@app.post("/api/interactive-plan", response_model=InteractivePlanResponse)
async def generate_interactive_plan(payload: dict):
    prompt = payload.get("prompt", "").strip()
    files_data = payload.get("files", [])
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required to formulate an implementation plan")
    
    files = []
    for f in files_data:
        try:
            files.append(IngestedFile(**f))
        except Exception:
            pass
            
    plan = await interactive_planner.plan_async(prompt, files)
    return plan

@app.get("/api/catalog")
async def get_tools_catalog():
    return {
        "total_tools": len(AI_TOOLS_CATALOG),
        "catalog": AI_TOOLS_CATALOG
    }

@app.post("/api/advisor/suggest", response_model=AdvisorResponse)
async def get_ai_advice(payload: dict):
    prompt = payload.get("prompt", "").strip()
    delivery_mode = str(payload.get("delivery_mode", "overdeliver")).strip().lower()
    if delivery_mode not in ["overdeliver", "strict"]:
        delivery_mode = "overdeliver"
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    response = await advisor_engine.advise_async(prompt, delivery_mode=delivery_mode)
    return response

from app.utils.file_parser import extract_text_from_file_bytes

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
GENERATED_DIR = UPLOAD_DIR / "generated"
GENERATED_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/api/generated-images", StaticFiles(directory=str(GENERATED_DIR)), name="generated-images")

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    contents = await file.read()
    filename = file.filename or "uploaded_file"

    # Save physical copy for local file access if needed
    save_path = UPLOAD_DIR / filename
    try:
        with open(save_path, "wb") as f_out:
            f_out.write(contents)
    except Exception as e:
        print(f"[Upload] Warning: Could not write file to uploads dir: {e}")

    # Extract readable text from PDF, Docx, or Plaintext
    extracted_text, detected_type = extract_text_from_file_bytes(filename, contents)
    
    # Store rich text context up to 45,000 chars for LLM context injection
    preview = extracted_text[:45000]

    return IngestedFile(
        filename=filename,
        content_type=detected_type or file.content_type or "application/octet-stream",
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
