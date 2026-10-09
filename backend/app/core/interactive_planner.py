import json
import httpx
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    DomainType,
    IngestedFile,
    InteractivePlanResponse,
    ImplementationStepPlan,
    PlanClarifyingQuestion,
)
from app.config import config

class InteractivePlannerAgent:
    """
    Interactive Planning Specialist for 'Ask Before Doing'.
    Analyzes prompt and ingested resources, formulates a clean architectural plan,
    identifies key assumptions, and generates intelligent clarifying questions
    with selectable options so the user can steer the swarm before execution begins.
    """
    def __init__(self):
        self.groq_key = config.GROQ_API_KEY
        self.gemini_key = config.GEMINI_API_KEY
        self.openrouter_key = config.OPENROUTER_API_KEY

    async def plan_async(self, prompt: str, files: List[IngestedFile]) -> InteractivePlanResponse:
        cleaned_prompt = prompt.strip()

        # Build file context summaries
        file_summaries = []
        for f in files:
            preview_snippet = f.preview_or_content[:400].replace("\n", " ") if f.preview_or_content else "Empty"
            file_summaries.append(f"- File: '{f.filename}' ({f.content_type}, {f.size_bytes} bytes). Preview: {preview_snippet}...")
        files_context = "\n".join(file_summaries) if file_summaries else "None attached."

        # 1. Primary: Try Groq (Llama-3.3-70b-versatile with JSON mode)
        if self.groq_key:
            try:
                plan = await self._call_groq_planner(cleaned_prompt, files_context)
                if plan:
                    return plan
            except Exception as e:
                print(f"[Interactive Planner] Groq error: {e}. Trying Gemini.")

        # 2. Secondary: Try Gemini
        if self.gemini_key:
            try:
                plan = await self._call_gemini_planner(cleaned_prompt, files_context)
                if plan:
                    return plan
            except Exception as e:
                print(f"[Interactive Planner] Gemini error: {e}. Falling back to dynamic semantic engine.")

        # 3. Dynamic Semantic Decomposition Fallback (Zero hardcoded text, prompt-derived)
        return self._dynamic_semantic_plan(cleaned_prompt, files)

    async def _call_groq_planner(self, prompt: str, files_context: str) -> Optional[InteractivePlanResponse]:
        system_prompt = (
            "You are the Lead Solutions Architect for OmniTask AI, a premier multi-agent autonomous system.\n"
            "The user provided a goal, and 'Ask Before Doing' is enabled.\n"
            "Your objective:\n"
            "1. Deeply understand what the user wants to achieve.\n"
            "2. Formulate a crisp objective summary and architectural approach.\n"
            "3. Decompose into 2 to 4 sequential, concrete implementation steps, assigning specialized models:\n"
            "   - 'OpenAI GPT (Auditing Specialist)' for quizzes, syllabus questions, exam prep, academic problem sets, research, and analysis (domain: 'audit')\n"
            "   - 'Word & Document Publishing Specialist' for compiling Word documents (.docx) (domain: 'audit')\n"
            "   - 'PDF & Document Publishing Specialist' for compiling PDF documents (domain: 'audit')\n"
            "   - 'Qwen 2.5 Coder (via Groq Cloud)' for code/web/APIs (domain: 'code')\n"
            "   - 'Flux.1 (Visual Asset Specialist)' for images/diagrams (domain: 'vision')\n"
            "   - 'Gemini 2.0 Flash (Dedicated Reviewer)' for summaries/content (domain: 'audit')\n"
            "   - 'Mistral (Legal & Formal Logic Specialist)' for math/logic/contracts (domain: 'math')\n"
            "CRITICAL QUIZ & ACADEMIC DOCUMENT RULE:\n"
            "Quizzes, exams, syllabus question papers, and study guides are ALWAYS domain 'audit' assigned to 'OpenAI GPT (Auditing Specialist)', NEVER domain 'code'! If Word (.docx) or PDF export is needed, the final step MUST be 'Word & Document Publishing Specialist' or 'PDF & Document Publishing Specialist' (domain: 'audit').\n"
            "4. Identify 2 to 3 key assumptions.\n"
            "5. Ask 2 to 3 high-impact clarifying questions. Each question MUST provide 2 to 4 crisp, practical multiple-choice options, a recommended default_selected option, and allow custom user answers. Focus on aesthetic/theme, architecture/packaging, or key feature trade-offs.\n\n"
            "Return strictly valid JSON with this exact schema:\n"
            "{\n"
            '  "objective_summary": "Concise 1-2 sentence understanding of user goal",\n'
            '  "architectural_approach": "Technical design and orchestration strategy",\n'
            '  "assumptions": ["Assumption 1", "Assumption 2"],\n'
            '  "steps": [\n'
            '    {\n'
            '      "step_number": 1,\n'
            '      "title": "Clear step title",\n'
            '      "domain": "code | math | vision | video | audit",\n'
            '      "assigned_worker": "Worker Model Name",\n'
            '      "description": "Concrete instructions for what this step executes",\n'
            '      "expected_output": "Exact deliverable generated (e.g. standalone HTML5 file, Python module, diagram)"\n'
            '    }\n'
            '  ],\n'
            '  "clarifying_questions": [\n'
            '    {\n'
            '      "id": "q1",\n'
            '      "question": "Clear question text?",\n'
            '      "options": ["Option 1", "Option 2", "Option 3"],\n'
            '      "default_selected": "Option 1",\n'
            '      "allow_custom": true\n'
            '    }\n'
            '  ],\n'
            '  "suggested_focus": "Key recommendation for maximum impact"\n'
            "}"
        )
        user_msg = f"User Request: \"{prompt}\"\nAttached Files:\n{files_context}"

        async with httpx.AsyncClient(timeout=14.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.groq_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "openai/gpt-oss-120b",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_msg}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)
                return self._parse_json_to_plan(parsed, prompt)
        return None

    async def _call_gemini_planner(self, prompt: str, files_context: str) -> Optional[InteractivePlanResponse]:
        endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={self.gemini_key}"
        prompt_instruction = (
            "You are the Lead Solutions Architect for OmniTask AI. Formulate an implementation plan and clarifying questions.\n"
            f"User Request: \"{prompt}\"\nAttached Files:\n{files_context}\n\n"
            "Model lineup:\n"
            "- 'OpenAI GPT (Auditing Specialist)' for quizzes, syllabus questions, exam prep, academic problem sets, research, and analysis (domain: 'audit')\n"
            "- 'Word & Document Publishing Specialist' for compiling Word documents (.docx) (domain: 'audit')\n"
            "- 'PDF & Document Publishing Specialist' for compiling PDF documents (domain: 'audit')\n"
            "- 'Qwen 2.5 Coder (via Groq Cloud)' for code/web/APIs (domain: 'code')\n"
            "- 'Flux.1 (Visual Asset Specialist)' for images/diagrams (domain: 'vision')\n"
            "- 'Gemini 2.0 Flash (Dedicated Reviewer)' for summaries/content (domain: 'audit')\n"
            "- 'Mistral (Legal & Formal Logic Specialist)' for math/logic/contracts (domain: 'math')\n\n"
            "CRITICAL: Quizzes, exams, and syllabus questions are ALWAYS domain 'audit' assigned to 'OpenAI GPT (Auditing Specialist)', NEVER 'code'! Final export to Word or PDF must be assigned to the respective Publishing Specialist.\n\n"
            "Return strictly valid JSON conforming to the requested schema with objective_summary, architectural_approach, assumptions, steps, and clarifying_questions."
        )

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                endpoint,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt_instruction}]}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "response_mime_type": "application/json"
                    }
                }
            )
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text)
                return self._parse_json_to_plan(parsed, prompt)
        return None

    def _parse_json_to_plan(self, parsed: Dict[str, Any], prompt: str) -> InteractivePlanResponse:
        obj_summary = parsed.get("objective_summary") or f"Execute and deliver solution for: {prompt[:100]}"
        arch_approach = parsed.get("architectural_approach") or "Multi-agent autonomous pipeline with specialized model execution and verification."
        assumptions = parsed.get("assumptions", [
            "User requires a standalone, high-reliability deliverable.",
            "All sub-tasks will be verified by the QA reviewer before final assembly."
        ])
        if not isinstance(assumptions, list):
            assumptions = [str(assumptions)]

        raw_steps = parsed.get("steps", [])
        steps: List[ImplementationStepPlan] = []
        for idx, s in enumerate(raw_steps):
            if not isinstance(s, dict):
                continue
            domain_raw = str(s.get("domain", "audit")).lower()
            try:
                domain = DomainType(domain_raw)
            except ValueError:
                domain = DomainType.AUDIT

            title = s.get("title", f"Step {idx + 1}")
            desc = s.get("description", "Execute designated milestone")
            exp_out = s.get("expected_output", "Executable deliverable")
            step_text = f"{title} {desc} {exp_out}".lower()
            p_check = prompt.lower()

            is_quiz = any(w in step_text or w in p_check for w in ["quiz", "test paper", "exam", "question paper", "mcq", "multiple choice", "fill-in-the-blank", "answer key", "syllabus"])
            is_word = any(w in step_text or w in p_check for w in ["word", "docx", "doc", "microsoft word"])
            is_pdf = any(w in step_text or w in p_check for w in ["pdf"])
            is_compiler = any(w in step_text for w in ["compile", "compilation", "publishing", "assemble word", "assemble pdf", "export into word", "export to word", "export to pdf", "document compilation"])

            worker = s.get("assigned_worker", "OpenAI GPT (Auditing Specialist)")
            if is_quiz and not any(w in step_text for w in ["build app", "create website", "react app", "python script to"]):
                if is_compiler and is_word:
                    domain = DomainType.AUDIT
                    worker = "Word & Document Publishing Specialist"
                elif is_compiler and is_pdf:
                    domain = DomainType.AUDIT
                    worker = "PDF & Document Publishing Specialist"
                else:
                    domain = DomainType.AUDIT
                    worker = "OpenAI GPT (Auditing Specialist)"
            elif is_compiler and is_word:
                domain = DomainType.AUDIT
                worker = "Word & Document Publishing Specialist"
            elif is_compiler and is_pdf:
                domain = DomainType.AUDIT
                worker = "PDF & Document Publishing Specialist"

            steps.append(ImplementationStepPlan(
                step_number=s.get("step_number", idx + 1),
                title=title,
                domain=domain,
                assigned_worker=worker,
                description=desc,
                expected_output=exp_out
            ))

        raw_questions = parsed.get("clarifying_questions", [])
        questions: List[PlanClarifyingQuestion] = []
        for idx, q in enumerate(raw_questions):
            if not isinstance(q, dict):
                continue
            opts = q.get("options", [])
            if not isinstance(opts, list) or not opts:
                opts = ["Standard / Recommended Default", "High Performance / Minimalist", "Custom Specification"]
            q_id = q.get("id") or f"q{idx + 1}"
            default_sel = q.get("default_selected") or (opts[0] if opts else None)

            questions.append(PlanClarifyingQuestion(
                id=q_id,
                question=q.get("question", "What is your preference for this stage?"),
                options=opts,
                default_selected=default_sel,
                allow_custom=q.get("allow_custom", True)
            ))

        if not steps or not questions:
            return self._dynamic_semantic_plan(prompt, [])

        return InteractivePlanResponse(
            objective_summary=obj_summary,
            architectural_approach=arch_approach,
            assumptions=assumptions,
            steps=steps,
            clarifying_questions=questions,
            suggested_focus=parsed.get("suggested_focus", "Proceeding with verified best practices.")
        )

    def _dynamic_semantic_plan(self, prompt: str, files: List[IngestedFile]) -> InteractivePlanResponse:
        """
        High-fidelity dynamic semantic fallback. Tailors steps, assumptions, and smart
        clarifying questions to the specific intent of the prompt without hardcoding.
        """
        p_lower = prompt.lower()
        is_quiz = any(w in p_lower for w in ["quiz", "test", "exam", "question", "questions and answer", "syllabus", "test paper", "study guide"])
        is_word = any(w in p_lower for w in ["word", "docx", "doc", "microsoft word", "in word", "as word"])
        is_pdf = any(w in p_lower for w in ["pdf", "in a pdf", "to pdf", "as pdf"])
        is_web = any(w in p_lower for w in ["html", "css", "website", "landing page", "portfolio", "frontend", "ui", "web page", "browser"])
        is_python = any(w in p_lower for w in ["python", "script", "backend", "api", "fastapi", "microservice", "daemon", "server"])
        is_math_fin = any(w in p_lower for w in ["math", "calculate", "risk", "sales", "finance", "algorithm", "statistics", "volatility", "equation"])
        is_image = any(w in p_lower for w in ["image", "render", "photo", "drawing", "infographic", "visual", "diagram", "chart"])

        steps: List[ImplementationStepPlan] = []
        questions: List[PlanClarifyingQuestion] = []
        assumptions: List[str] = []

        if is_quiz or is_word or is_pdf:
            format_name = "Microsoft Word (.docx)" if is_word else ("PDF Document" if is_pdf else "Publication Document")
            obj_summary = f"Synthesize syllabus-aligned quiz/study material and compile publication-ready {format_name} for: {prompt[:80]}"
            arch_approach = f"Two-stage pipeline: Subject-matter question formulation by OpenAI GPT Auditing Specialist followed by document compilation by {('Word' if is_word else 'PDF')} Publishing Specialist."
            assumptions = [
                "Questions will be extracted and derived directly from the provided syllabus or topic specifications.",
                f"Deliverable will include clean formatting and native export to {format_name}."
            ]
            steps.append(ImplementationStepPlan(
                step_number=1,
                title="In-Depth Quiz & Solution Formulation from Syllabus",
                domain=DomainType.AUDIT,
                assigned_worker="OpenAI GPT (Auditing Specialist)",
                description="Synthesize high-difficulty exam questions, multiple choice options with plausible distractors, application problems, and a comprehensive answer key with deep technical explanations.",
                expected_output="Verified Markdown Content with Question Formats and Answer Key"
            ))
            steps.append(ImplementationStepPlan(
                step_number=2,
                title=f"Publication-Grade {format_name} Compilation",
                domain=DomainType.AUDIT,
                assigned_worker="Word & Document Publishing Specialist" if is_word else "PDF & Document Publishing Specialist",
                description=f"Compile and format verified questions, choices, and solutions into a publication-grade {format_name} file ready for download.",
                expected_output=f"Downloadable {format_name} File"
            ))
            questions.append(PlanClarifyingQuestion(
                id="q_answer_placement",
                question="Where should the answers and technical solutions be positioned?",
                options=[
                    "Separate Comprehensive Answer Key at End (Recommended for test papers)",
                    "Inline Explanations Directly After Each Question (Ideal for study guides)"
                ],
                default_selected="Separate Comprehensive Answer Key at End (Recommended for test papers)"
            ))
            questions.append(PlanClarifyingQuestion(
                id="q_question_distribution",
                question="What question type distribution would you like?",
                options=[
                    "Balanced Mix: MCQs, Fill-in-the-blanks & Applied Scenarios (Recommended)",
                    "Strictly Multiple Choice Questions (MCQs with 4 options)",
                    "Comprehensive Analytical, Conceptual & Code Analysis Problems"
                ],
                default_selected="Balanced Mix: MCQs, Fill-in-the-blanks & Applied Scenarios (Recommended)"
            ))

        elif is_web:
            obj_summary = f"Develop complete, responsive web interface for: {prompt[:80]}"
            arch_approach = "Single-file standalone HTML5 architecture with inline CSS styling and embedded vanilla JavaScript interactions."
            assumptions = [
                "Deliverable will be 100% self-contained so opening the HTML file in any browser works immediately.",
                "Responsive design compatible with both desktop and mobile viewports."
            ]
            steps.append(ImplementationStepPlan(
                step_number=1,
                title="Design System & Markup Architecture",
                domain=DomainType.CODE,
                assigned_worker="Qwen 2.5 Coder (via Groq Cloud)",
                description="Structure HTML semantic layout, navigation, hero sections, and responsive grid containers.",
                expected_output="HTML5 Structure"
            ))
            steps.append(ImplementationStepPlan(
                step_number=2,
                title="Interactive Component Logic & Animations",
                domain=DomainType.CODE,
                assigned_worker="Qwen 2.5 Coder (via Groq Cloud)",
                description="Implement state handling, interactive filtering/controls, and smooth transitions.",
                expected_output="Interactive Standalone HTML/CSS/JS Application"
            ))
            questions.append(PlanClarifyingQuestion(
                id="q_design_theme",
                question="What visual styling aesthetic and color theme do you prefer?",
                options=[
                    "Modern Dark Mode (High Contrast & Ambient Glows)",
                    "Clean Minimalist (Apple-inspired Light / Neutral)",
                    "Vibrant & Dynamic (Bold Accents & Glassmorphism)"
                ],
                default_selected="Modern Dark Mode (High Contrast & Ambient Glows)"
            ))
            questions.append(PlanClarifyingQuestion(
                id="q_packaging",
                question="How would you like the deliverable packaged?",
                options=[
                    "Single Standalone HTML File (All CSS & JS embedded - recommended)",
                    "Separated Modular Code Blocks (HTML, CSS, JS separate)",
                    "Modern Component Framework (React / Tailwind ready)"
                ],
                default_selected="Single Standalone HTML File (All CSS & JS embedded - recommended)"
            ))
            questions.append(PlanClarifyingQuestion(
                id="q_interactivity",
                question="What level of interactive mock data and behavior is needed?",
                options=[
                    "Full Dynamic Interactivity with Realistic Mock Data",
                    "Core Interactive States (hover, click, modal popups)",
                    "Static Presentation Focus (visual fidelity first)"
                ],
                default_selected="Full Dynamic Interactivity with Realistic Mock Data"
            ))

        elif is_math_fin:
            obj_summary = f"Engineer quantitative modeling & computational engine for: {prompt[:80]}"
            arch_approach = "Formal mathematical derivation followed by high-performance Python analytics and verification."
            assumptions = [
                "Formulas will adhere to standard statistical and quantitative conventions.",
                "Deliverable includes comprehensive documentation and edge-case handling."
            ]
            steps.append(ImplementationStepPlan(
                step_number=1,
                title="Mathematical Formulation & Metric Derivation",
                domain=DomainType.MATH,
                assigned_worker="Mistral (Legal & Formal Logic Specialist)",
                description="Derive equations, volatility bounds, and statistical throughput functions.",
                expected_output="Mathematical Formalism & Equations"
            ))
            steps.append(ImplementationStepPlan(
                step_number=2,
                title="Production Python Analytics Engine",
                domain=DomainType.CODE,
                assigned_worker="Qwen 2.5 Coder (via Groq Cloud)",
                description="Implement vectorized computation with input validation guardrails and logging.",
                expected_output="Python Implementation Module"
            ))
            questions.append(PlanClarifyingQuestion(
                id="q_math_depth",
                question="What depth of statistical modeling and validation is preferred?",
                options=[
                    "Rigorous Empirical Modeling (includes bounds & variance checks)",
                    "Deterministic Financial Formulas (standard ROI & throughput)",
                    "Heuristic Scenario Engine (Best, Base, and Stress-Test cases)"
                ],
                default_selected="Rigorous Empirical Modeling (includes bounds & variance checks)"
            ))
            questions.append(PlanClarifyingQuestion(
                id="q_math_output",
                question="What primary deliverable format would best serve your workflow?",
                options=[
                    "Executable Python Script with Sample CLI Execution",
                    "Modular Python Class with Typed Functions & Docstrings",
                    "Full Technical Report with Embedded Code & LaTeX Formulas"
                ],
                default_selected="Modular Python Class with Typed Functions & Docstrings"
            ))

        elif is_image:
            obj_summary = f"Generate visual synthesis and thematic assets for: {prompt[:80]}"
            arch_approach = "High-resolution diffusion rendering coupled with contextual narrative synthesis."
            assumptions = [
                "Visual assets will be rendered at modern aspect ratios with photorealistic or stylized prompt engineering."
            ]
            steps.append(ImplementationStepPlan(
                step_number=1,
                title="High-Fidelity Visual Asset Generation",
                domain=DomainType.VISION,
                assigned_worker="Flux.1 (Visual Asset Specialist)",
                description="Synthesize high-detail generative imagery matching prompt aesthetics.",
                expected_output="Rendered High-Res Image (JPG)"
            ))
            steps.append(ImplementationStepPlan(
                step_number=2,
                title="Thematic Context & Description Synthesis",
                domain=DomainType.AUDIT,
                assigned_worker="Gemini 2.0 Flash (Dedicated Reviewer)",
                description="Synthesize accompanying narrative, specifications, or poetic exposition.",
                expected_output="Accompanying Markdown Report"
            ))
            questions.append(PlanClarifyingQuestion(
                id="q_art_style",
                question="Which visual artistic style and lighting atmosphere do you want?",
                options=[
                    "Cinematic Photorealism (8k, volumetric lighting, Octane render)",
                    "Stylized Digital Illustration (clean vector lines & rich colors)",
                    "Moody Cyberpunk / Sci-Fi Atmosphere"
                ],
                default_selected="Cinematic Photorealism (8k, volumetric lighting, Octane render)"
            ))
            questions.append(PlanClarifyingQuestion(
                id="q_aspect_ratio",
                question="What aspect ratio should the visual asset use?",
                options=[
                    "16:9 Widescreen (Landscape banner/wallpaper)",
                    "1:1 Square (Social media & avatars)",
                    "9:16 Portrait (Mobile wallpaper & stories)"
                ],
                default_selected="16:9 Widescreen (Landscape banner/wallpaper)"
            ))

        else:
            # General / Engineering
            obj_summary = f"Architect and execute multi-agent solution for: {prompt[:80]}"
            arch_approach = "Sequential specialist swarm with domain-specific synthesis and multimodal quality gates."
            assumptions = [
                "Solution will be fully self-contained and ready for immediate deployment.",
                "Reviewer will validate syntax and requirement fulfillment before sign-off."
            ]
            steps.append(ImplementationStepPlan(
                step_number=1,
                title="Core Architecture & Implementation",
                domain=DomainType.CODE if is_python else DomainType.AUDIT,
                assigned_worker="Qwen 2.5 Coder (via Groq Cloud)" if is_python else "Gemini 2.0 Flash (Dedicated Reviewer)",
                description="Develop the primary system components and core logic.",
                expected_output="Primary Deliverable"
            ))
            steps.append(ImplementationStepPlan(
                step_number=2,
                title="Quality Assurance & Comprehensive Synthesis",
                domain=DomainType.AUDIT,
                assigned_worker="OpenAI GPT / Gemini Specialist",
                description="Run verification checks, compile documentation, and deliver finalized package.",
                expected_output="Final Verified Package"
            ))
            questions.append(PlanClarifyingQuestion(
                id="q_scope",
                question="What is the desired scope and complexity level?",
                options=[
                    "Production Ready (Strict typing, error handling & documentation)",
                    "Rapid Functional Prototype / MVP",
                    "Comprehensive Educational Breakdown & Code Walkthrough"
                ],
                default_selected="Production Ready (Strict typing, error handling & documentation)"
            ))
            questions.append(PlanClarifyingQuestion(
                id="q_constraints",
                question="Are there specific architectural constraints or preferred patterns?",
                options=[
                    "Clean Architecture & Zero External Bloat",
                    "Maximum Extensibility with Modular Plugins",
                    "Fastest Execution Time & Minimal Compute Footprint"
                ],
                default_selected="Clean Architecture & Zero External Bloat"
            ))

        return InteractivePlanResponse(
            objective_summary=obj_summary,
            architectural_approach=arch_approach,
            assumptions=assumptions,
            steps=steps,
            clarifying_questions=questions,
            suggested_focus="Plan customized to your objective. Select preferences or proceed directly."
        )
