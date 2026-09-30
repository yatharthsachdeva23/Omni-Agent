import re
from typing import List
from app.models.schemas import (
    DomainType,
    StructuredSubTask,
    StructuredGoal,
    IngestedFile,
    TaskStatus,
)

class JSONStructurerAgent:
    """
    Step 1: Converts unstructured, conversational natural language and file inputs
    into a typed, validated state schema required by Jev for System 1 decision-making.
    """
    def __init__(self, model_name: str = "Omni-Structurer-v1"):
        self.model_name = model_name

    def structure(self, prompt: str, files: List[IngestedFile]) -> StructuredGoal:
        cleaned_prompt = prompt.strip()
        
        # Extract explicit constraints or deduce them
        constraints = [
            "Must maintain strict execution integrity across sub-agents.",
            "All intermediate outputs must pass domain-specific quality reviews before commit."
        ]
        if "fast" in cleaned_prompt.lower():
            constraints.append("Optimize for latency and rapid turnaround.")
        if "high quality" in cleaned_prompt.lower() or "accurate" in cleaned_prompt.lower():
            constraints.append("Zero tolerance for calculation or syntax deviations.")

        prerequisites = [
            f"User Objective: {cleaned_prompt}"
        ]
        for f in files:
            prerequisites.append(f"Ingested Resource: {f.filename} ({f.content_type}, {f.size_bytes} bytes)")

        # Prepare preliminary sub-tasks to be refined by Jev
        preliminary_tasks = self._pre_classify(cleaned_prompt, files)

        return StructuredGoal(
            primary_objective=cleaned_prompt,
            prerequisites=prerequisites,
            constraints=constraints,
            sub_tasks=preliminary_tasks,
            jev_routing_latency_ms=0.0,
            jev_confidence=0.99
        )

    def _pre_classify(self, prompt: str, files: List[IngestedFile]) -> List[StructuredSubTask]:
        """
        Extracts foundational domains present in the prompt.
        """
        p_lower = prompt.lower()
        subtasks: List[StructuredSubTask] = []
        step_idx = 1

        # Check for Math / Calculation
        if any(w in p_lower for w in ["math", "calculate", "equation", "formula", "regression", "statistics", "numerical", "finance", "revenue", "roi", "data analysis"]):
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title="Quantitative & Mathematical Analysis",
                domain=DomainType.MATH,
                description="Perform rigorous numerical derivation, statistical calculation, or algorithmic formula evaluation.",
                assigned_worker_model="DeepSeek-R1 / Qwen-2.5-Math",
                assigned_reviewer_model="Formal-Math-Verifier-v2",
                required_prerequisites=["Raw user parameters", "Numerical bounds"],
                expected_output_type="json_metrics_and_equations",
                status=TaskStatus.PENDING
            ))
            step_idx += 1

        # Check for Code / Software Development
        if any(w in p_lower for w in ["code", "python", "script", "program", "api", "function", "backend", "algorithm", "develop", "software"]):
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title="Software Architecture & Code Generation",
                domain=DomainType.CODE,
                description="Engineer production-grade, modular, and type-safe code implementation.",
                assigned_worker_model="Claude 3.5 Sonnet / OpenAI o3-mini",
                assigned_reviewer_model="Static-Linter-and-Security-Auditor",
                required_prerequisites=[f"step_{step_idx-1}"] if step_idx > 1 else ["System specifications"],
                expected_output_type="executable_code_and_docs",
                status=TaskStatus.PENDING
            ))
            step_idx += 1

        # Check for Visual / Image Generation
        if any(w in p_lower for w in ["image", "picture", "infographic", "visual", "logo", "mockup", "photo", "render", "diagram"]):
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title="Visual Asset & Infographic Synthesis",
                domain=DomainType.VISION,
                description="Synthesize high-fidelity visual representations, diagrams, or branding assets matching exact styling parameters.",
                assigned_worker_model="Midjourney v6 / Flux.1-Pro",
                assigned_reviewer_model="Multimodal-Vision-Inspector-v3 (Gemini 2.0 Flash Vision)",
                required_prerequisites=[f"step_{step_idx-1}"] if step_idx > 1 else ["Visual style directives"],
                expected_output_type="rendered_image_url_and_metadata",
                status=TaskStatus.PENDING
            ))
            step_idx += 1

        # Check for Video / Motion
        if any(w in p_lower for w in ["video", "animation", "motion", "cinematic", "clip", "teaser"]):
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title="Video & Motion Media Production",
                domain=DomainType.VIDEO,
                description="Produce cinematic motion visuals or storyboard animations.",
                assigned_worker_model="Runway Gen-3 Alpha / Sora",
                assigned_reviewer_model="Temporal-Frame-Consistency-Reviewer",
                required_prerequisites=[f"step_{step_idx-1}"] if step_idx > 1 else ["Motion script"],
                expected_output_type="video_render_and_manifest",
                status=TaskStatus.PENDING
            ))
            step_idx += 1

        # If no specific domain triggered or general summary/audit requested:
        if not subtasks or any(w in p_lower for w in ["audit", "review", "summary", "summarize", "report", "overview", "plan", "research"]):
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title="Analytical Synthesis & Comprehensive Audit",
                domain=DomainType.AUDIT,
                description="Synthesize holistic findings, conduct cross-verification, and compile strategic briefing report.",
                assigned_worker_model="Gemini 2.0 Pro / GPT-4o Analytical",
                assigned_reviewer_model="Logic-Consistency-Auditor",
                required_prerequisites=[f"step_{step_idx-1}"] if step_idx > 1 else ["Source data"],
                expected_output_type="analytical_report_markdown",
                status=TaskStatus.PENDING
            ))

        return subtasks
