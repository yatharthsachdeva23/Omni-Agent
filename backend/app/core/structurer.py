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
            is_diagram = any(w in p_lower for w in ["diagram", "chart", "infographic", "architecture", "flowchart", "schematic"])
            title = "Technical Infographic & Diagram Synthesis" if is_diagram else "Visual Asset & Creative Image Generation"
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title=title,
                domain=DomainType.VISION,
                description=f"Synthesize high-fidelity visual asset or render matching user goal: {prompt[:120]}",
                assigned_worker_model="Flux.1 Schnell (Visual Specialist)",
                assigned_reviewer_model="Multimodal-Vision-Inspector (Gemini 2.0 Flash Vision)",
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

        # Check for Exam / Study / Questions / Quiz / Notes Synthesis
        if any(w in p_lower for w in ["exam", "test", "quiz", "question", "questions and answer", "study", "prep", "notes", "lecture"]):
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title="Exam Preparation & Question-Answer Generation",
                domain=DomainType.AUDIT,
                description="Synthesize key concepts from provided notes, formulate top high-yield exam questions, and provide authoritative answers.",
                assigned_worker_model="OpenAI GPT-4o-mini / Gemini",
                assigned_reviewer_model="Academic-Pedagogy-and-Fidelity-Reviewer",
                required_prerequisites=["Attached notes and syllabus"],
                expected_output_type="exam_questions_and_solutions_markdown",
                status=TaskStatus.PENDING
            ))
            step_idx += 1

        # If no specific domain triggered or general summary/audit requested:
        if not subtasks:
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title="Analytical Synthesis & Comprehensive Deliverable",
                domain=DomainType.AUDIT,
                description=f"Synthesize findings and execute the user's objective: {prompt[:120]}",
                assigned_worker_model="OpenAI GPT / Gemini Specialist",
                assigned_reviewer_model="Logic-Consistency-Auditor",
                required_prerequisites=[f"step_{step_idx-1}"] if step_idx > 1 else ["Source data"],
                expected_output_type="analytical_report_markdown",
                status=TaskStatus.PENDING
            ))

        return subtasks
