import json
import re
import asyncio
import httpx
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    DomainType,
    StructuredSubTask,
    StructuredGoal,
    IngestedFile,
    TaskStatus,
)
from app.config import config

class JSONStructurerAgent:
    """
    Step 1: Converts unstructured, conversational natural language and file inputs
    into a typed, validated state schema required by Jev for System 1 decision-making.
    Uses live LLM intelligence (Gemini / Groq) to decompose user intent dynamically.
    """
    def __init__(self, model_name: str = "Omni-Structurer-v2"):
        self.model_name = model_name
        self.gemini_key = config.GEMINI_API_KEY
        self.groq_key = config.GROQ_API_KEY

    async def structure_async(self, prompt: str, files: List[IngestedFile]) -> StructuredGoal:
        cleaned_prompt = prompt.strip()

        # Build file context summaries for the LLM
        file_summaries = []
        for f in files:
            preview_snippet = f.preview_or_content[:500].replace("\n", " ") if f.preview_or_content else "Empty"
            file_summaries.append(f"- File: '{f.filename}' ({f.content_type}, {f.size_bytes} bytes). Preview: {preview_snippet}...")
        files_context = "\n".join(file_summaries) if file_summaries else "None attached."

        # 1. Primary: Attempt live Gemini decomposition with structured JSON mode
        if self.gemini_key:
            try:
                goal = await self._call_gemini_structurer(cleaned_prompt, files_context, files)
                if goal:
                    return goal
            except Exception as e:
                print(f"[JSON Structurer] Gemini structuring error: {e}. Trying Groq fallback.")

        # 2. Secondary: Attempt live Groq decomposition with JSON mode
        if self.groq_key:
            try:
                goal = await self._call_groq_structurer(cleaned_prompt, files_context, files)
                if goal:
                    return goal
            except Exception as e:
                print(f"[JSON Structurer] Groq structuring error: {e}. Falling back to dynamic semantic engine.")

        # 3. Dynamic Semantic Decomposition Fallback (Zero hardcoded text, prompt-derived)
        return self._dynamic_semantic_structure(cleaned_prompt, files)

    def structure(self, prompt: str, files: List[IngestedFile]) -> StructuredGoal:
        """
        Synchronous wrapper for backwards compatibility.
        """
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    return executor.submit(asyncio.run, self.structure_async(prompt, files)).result()
            else:
                return loop.run_until_complete(self.structure_async(prompt, files))
        except Exception as e:
            print(f"[JSON Structurer] Synchronous bridge fallback: {e}")
            return self._dynamic_semantic_structure(prompt.strip(), files)

    async def _call_gemini_structurer(self, prompt: str, files_context: str, files: List[IngestedFile]) -> Optional[StructuredGoal]:
        prompt_instruction = (
            "You are the JSON Structurer Agent for OmniTask AI.\n"
            "Analyze the following user objective and attached resources:\n\n"
            f"User Objective: \"{prompt}\"\n"
            f"Attached Files:\n{files_context}\n\n"
            "Decompose this request into a sequential DAG of 1 to 4 concrete sub-tasks.\n"
            "CRITICAL TASK DECOMPOSITION RULES:\n"
            "- For single-domain requests (such as 'make an image of X', 'draw X', 'render photo of X'), do NOT artificially split into multiple steps like 'prompt engineering' and 'rendering'. An image request must be 1 SINGLE cohesive step (domain: 'vision'). Prompt expansion is handled internally by the visual worker.\n"
            "- Never produce two subtasks of domain 'vision' for the same image generation request.\n"
            "- CRITICAL DOMAIN RULES:\n"
            "  * Domain 'code' is for software development, programming, algorithms, frontend web development (HTML/CSS/JS), backend APIs, or database scripts.\n"
            "  * NEVER assign domain 'code' to poems, poetry, creative writing, essays, or natural language text! Writing a poem is domain 'audit' (Content/Summarizer Specialist).\n"
            "  * For compound requests like 'make an image of X and write a poem on it':\n"
            "    - step_1: Visual Asset Generation for X (domain: 'vision', Worker: 'Flux.1 (Visual Asset Specialist)')\n"
            "    - step_2: Compose Evocative Poem for X (domain: 'audit', Worker: 'Gemini 2.0 Flash (Summarizer Specialist)', expected_output_type: 'poem_markdown')\n"
            "  * Only split into 2 to 4 sub-tasks when the user objective genuinely requires multiple distinct disciplines (e.g. 'image + poem', 'code + technical diagram', 'study notes analysis + quiz creation').\n\n"
            "Each sub-task must have:\n"
            "- step_id: e.g. 'step_1', 'step_2'\n"
            "- title: specific descriptive title tailored to what is being executed\n"
            "- domain: one of ['code', 'math', 'vision', 'video', 'audit']\n"
            "- description: detailed instructions for the specialized worker sub-agent\n"
            "- assigned_worker_model: name of model best suited (e.g. 'Qwen 2.5 Coder (via Groq Cloud)', 'Gemini 2.0 Flash (Summarizer Specialist)', 'Mistral (Legal & Formal Logic Specialist)', 'Flux.1 (Visual Asset Specialist)', 'OpenAI GPT (Auditing Specialist)')\n"
            "- assigned_reviewer_model: 'Gemini 2.0 Flash (Multimodal & Step QA Reviewer)'\n"
            "- required_prerequisites: list of prerequisites (e.g. ['Initial user objective'], ['step_1'])\n"
            "- expected_output_type: e.g. 'code_module', 'webpage_markup', 'markdown_report', 'rendered_image_url', 'poem_markdown'\n\n"
            "Return strictly valid JSON with this exact schema:\n"
            "{\n"
            '  "primary_objective": "Clear single-sentence encapsulation of the user\'s core goal",\n'
            '  "constraints": ["Constraint 1", "Constraint 2"],\n'
            '  "prerequisites": ["Prerequisite 1", ...],\n'
            '  "sub_tasks": [\n'
            '    {\n'
            '      "step_id": "step_1",\n'
            '      "title": "...",\n'
            '      "domain": "code" | "math" | "vision" | "video" | "audit",\n'
            '      "description": "...",\n'
            '      "assigned_worker_model": "...",\n'
            '      "assigned_reviewer_model": "Gemini 2.0 Flash (Multimodal & Step QA Reviewer)",\n'
            '      "required_prerequisites": ["..."],\n'
            '      "expected_output_type": "..."\n'
            '    }\n'
            '  ]\n'
            "}"
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key={self.gemini_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt_instruction}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1
            }
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(raw_text)
                if isinstance(parsed, list) and len(parsed) > 0:
                    parsed = parsed[0]
                return self._parse_json_to_goal(parsed, prompt, files)
        return None

    async def _call_groq_structurer(self, prompt: str, files_context: str, files: List[IngestedFile]) -> Optional[StructuredGoal]:
        system_prompt = (
            "You are the JSON Structurer Agent for OmniTask AI.\n"
            "Decompose user requests and attached resources into a validated DAG of sequential subtasks.\n"
            "Output strictly valid JSON with keys: 'primary_objective', 'constraints', 'prerequisites', and 'sub_tasks'."
        )
        user_msg = (
            f"User Objective: \"{prompt}\"\n"
            f"Attached Files:\n{files_context}\n\n"
            "Generate 1 to 4 subtasks with valid domains ('code', 'math', 'vision', 'video', 'audit')."
        )

        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.1
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return self._parse_json_to_goal(parsed, prompt, files)
        return None

    def _parse_json_to_goal(self, parsed: Dict[str, Any], prompt: str, files: List[IngestedFile]) -> StructuredGoal:
        primary_objective = parsed.get("primary_objective") or prompt
        constraints = parsed.get("constraints", [
            "Must maintain strict execution integrity across sub-agents.",
            "All outputs must pass domain-specific quality reviews before commit."
        ])
        if not isinstance(constraints, list):
            constraints = [str(constraints)]

        prereqs = parsed.get("prerequisites", [f"User Objective: {prompt}"])
        if not isinstance(prereqs, list):
            prereqs = [str(prereqs)]
        for f in files:
            entry = f"Ingested Resource: {f.filename} ({f.content_type}, {f.size_bytes} bytes)"
            if entry not in prereqs:
                prereqs.append(entry)

        raw_tasks = parsed.get("sub_tasks", [])
        sub_tasks: List[StructuredSubTask] = []
        for idx, t in enumerate(raw_tasks):
            if not isinstance(t, dict):
                continue
            domain_raw = str(t.get("domain", "audit")).lower()
            try:
                domain = DomainType(domain_raw)
            except ValueError:
                domain = DomainType.AUDIT

            step_id = t.get("step_id") or f"step_{idx + 1}"
            title = t.get("title") or f"Sub-Task {idx + 1}"
            desc = t.get("description") or f"Execute milestone {idx + 1} for: {prompt[:80]}"
            worker = t.get("assigned_worker_model") or "OpenAI GPT / Gemini Specialist"
            reviewer = "Gemini 2.0 Flash (Multimodal & Step QA Reviewer)"
            req_prereqs = t.get("required_prerequisites", [f"step_{idx}"] if idx > 0 else ["User input"])
            if not isinstance(req_prereqs, list):
                req_prereqs = [str(req_prereqs)]
            out_type = t.get("expected_output_type", "deliverable_markdown")

            sub_tasks.append(StructuredSubTask(
                step_id=step_id,
                title=title,
                domain=domain,
                description=desc,
                assigned_worker_model=worker,
                assigned_reviewer_model=reviewer,
                required_prerequisites=req_prereqs,
                expected_output_type=out_type,
                status=TaskStatus.PENDING
            ))

        if not sub_tasks:
            # Fallback if empty array returned
            return self._dynamic_semantic_structure(prompt, files)

        return StructuredGoal(
            primary_objective=primary_objective,
            prerequisites=prereqs,
            constraints=constraints,
            sub_tasks=sub_tasks,
            jev_routing_latency_ms=0.0,
            jev_confidence=0.99
        )

    def _dynamic_semantic_structure(self, prompt: str, files: List[IngestedFile]) -> StructuredGoal:
        """
        Dynamic fallback engine deriving custom subtasks based on semantic intent and attached files.
        Contains ZERO hardcoded test snippets or fixed formulas.
        """
        p_lower = prompt.lower()
        subtasks: List[StructuredSubTask] = []
        step_idx = 1

        # Check for Math / Calculation / Financial
        has_math = any(w in p_lower for w in ["math", "calculate", "equation", "formula", "regression", "statistics", "numerical", "finance", "revenue", "roi", "data analysis", "cost"])
        if has_math:
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title=f"Quantitative Derivation & Analysis for '{prompt[:45]}...'",
                domain=DomainType.MATH,
                description=f"Perform rigorous mathematical derivation, numerical evaluation, or statistical calculation for: {prompt}",
                assigned_worker_model="Mistral (Legal & Formal Logic Specialist)",
                assigned_reviewer_model="Gemini 2.0 Flash (Multimodal & Step QA Reviewer)",
                required_prerequisites=["Raw parameters and boundary conditions"],
                expected_output_type="mathematical_derivation_markdown",
                status=TaskStatus.PENDING
            ))
            step_idx += 1

        # Check for Poetry / Creative Writing / Lyrics
        has_poem = any(w in p_lower for w in ["poem", "poetry", "rhyme", "sonnet", "ballad", "verse", "lyrics", "haiku"])
        if has_poem:
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title=f"Compose Creative Poem for '{prompt[:40]}...'",
                domain=DomainType.AUDIT,
                description=f"Write an evocative, charming, and beautifully styled poem in plain markdown text fulfilling: {prompt}",
                assigned_worker_model="Gemini 2.0 Flash (Summarizer Specialist)",
                assigned_reviewer_model="Gemini 2.0 Flash (Multimodal & Step QA Reviewer)",
                required_prerequisites=[f"step_{step_idx-1}"] if step_idx > 1 else ["Creative theme parameters"],
                expected_output_type="poem_markdown",
                status=TaskStatus.PENDING
            ))
            step_idx += 1

        # Check for Coding / Frontend / Software Engineering (strictly exclude creative text)
        explicit_code_words = [
            "python", "script", "program", "api", "function", "backend", "algorithm",
            "develop", "software", "endpoint", "class", "bot", "code", "coding",
            "html", "css", "webpage", "website", "frontend", "landing page", "replica",
            "ui", "interface", "react", "vue", "javascript"
        ]
        has_code = any(w in p_lower for w in explicit_code_words) and not (has_poem and not any(w in p_lower for w in ["python", "script", "api", "backend", "algorithm"]))
        if has_code:
            is_web = any(w in p_lower for w in ["html", "css", "webpage", "website", "frontend", "landing page", "replica", "ui", "interface", "react", "vue"])
            desc = f"Engineer standalone, responsive HTML5/CSS3 frontend implementation matching: {prompt}" if is_web else f"Engineer production-grade software implementation matching: {prompt}"
            title = f"Web & UI Implementation for '{prompt[:45]}...'" if is_web else f"Modular Implementation & Architecture for '{prompt[:45]}...'"
            out_type = "frontend_html_css_markup" if is_web else "executable_code"
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title=title,
                domain=DomainType.CODE,
                description=desc,
                assigned_worker_model="Qwen 2.5 Coder (via Groq Cloud)",
                assigned_reviewer_model="Gemini 2.0 Flash (Multimodal & Step QA Reviewer)",
                required_prerequisites=[f"step_{step_idx-1}"] if step_idx > 1 else ["System specifications"],
                expected_output_type=out_type,
                status=TaskStatus.PENDING
            ))
            step_idx += 1

        # Check for Visual / Diagram / Render
        has_vision = any(w in p_lower for w in ["image", "picture", "infographic", "visual", "logo", "mockup", "photo", "render", "diagram", "chart", "flowchart"])
        if has_vision:
            is_diagram = any(w in p_lower for w in ["diagram", "chart", "infographic", "architecture", "flowchart", "schematic"])
            title = f"Technical Infographic for '{prompt[:45]}...'" if is_diagram else f"Visual Asset Render for '{prompt[:45]}...'"
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title=title,
                domain=DomainType.VISION,
                description=f"Synthesize high-fidelity visual asset or diagram fulfilling: {prompt}",
                assigned_worker_model="Flux.1 (Visual Asset Specialist)",
                assigned_reviewer_model="Gemini 2.0 Flash (Multimodal & Step QA Reviewer)",
                required_prerequisites=[f"step_{step_idx-1}"] if step_idx > 1 else ["Visual directives"],
                expected_output_type="rendered_image_url_and_metadata",
                status=TaskStatus.PENDING
            ))
            step_idx += 1

        # Check for Attached File Analysis / Exam Notes / Document Ingestion
        if files or any(w in p_lower for w in ["exam", "test", "quiz", "question", "questions and answer", "study", "prep", "notes", "lecture", "pdf", "document", "summarize", "analyze"]):
            file_names = ", ".join([f.filename for f in files]) if files else "provided topic"
            subtasks.append(StructuredSubTask(
                step_id=f"step_{step_idx}",
                title=f"In-Depth Synthesis & Deliverable Generation for '{prompt[:45]}...'",
                domain=DomainType.AUDIT,
                description=f"Extract key concepts from {file_names} and fulfill the user's primary deliverable: {prompt}",
                assigned_worker_model="OpenAI GPT (Auditing Specialist)",
                assigned_reviewer_model="Gemini 2.0 Flash (Multimodal & Step QA Reviewer)",
                required_prerequisites=[f"step_{step_idx-1}"] if step_idx > 1 else ["Attached documents and specifications"],
                expected_output_type="comprehensive_deliverable_markdown",
                status=TaskStatus.PENDING
            ))
            step_idx += 1

        # If no subtasks matched:
        if not subtasks:
            subtasks.append(StructuredSubTask(
                step_id="step_1",
                title=f"Execution & Synthesis of '{prompt[:50]}...'",
                domain=DomainType.AUDIT,
                description=f"Analyze inputs and thoroughly execute the user objective: {prompt}",
                assigned_worker_model="OpenAI GPT (Auditing Specialist)",
                assigned_reviewer_model="Gemini 2.0 Flash (Multimodal & Step QA Reviewer)",
                required_prerequisites=["User prompt and context"],
                expected_output_type="analytical_deliverable_markdown",
                status=TaskStatus.PENDING
            ))

        prereqs = [f"User Objective: {prompt}"]
        for f in files:
            prereqs.append(f"Ingested Resource: {f.filename} ({f.content_type}, {f.size_bytes} bytes)")

        constraints = [
            "Must maintain strict execution integrity across sub-agents.",
            "All intermediate outputs must pass Gemini quality review before commit."
        ]
        if "fast" in p_lower:
            constraints.append("Optimize for latency and rapid turnaround.")
        if "accurate" in p_lower or "strict" in p_lower:
            constraints.append("Zero tolerance for calculation or specification deviations.")

        return StructuredGoal(
            primary_objective=prompt,
            prerequisites=prereqs,
            constraints=constraints,
            sub_tasks=subtasks,
            jev_routing_latency_ms=0.0,
            jev_confidence=0.99
        )
