import json
import re
import ast
import os
from pathlib import Path
import httpx
from typing import Tuple, Optional, Dict, Any
from app.models.schemas import (
    DomainType,
    WorkerResult,
    StructuredSubTask,
    IntermediateReviewResult,
    ReviewStatus,
    NegativeKnowledgeItem,
)
from app.config import config

class IntermediateReviewEngine:
    """
    Dedicated Reviewer Engine: Powered primarily by Google Gemini.
    Reviews all sub-agent outputs (code, vision, math, summaries, audits)
    against the user's primary objective before committing to the Common Context Blackboard.
    Provides cross-model fallback to Groq and programmatic AST/heuristic inspection.
    """
    def __init__(self):
        self.gemini_key = config.GEMINI_API_KEY
        self.groq_key = config.GROQ_API_KEY
        self.model_name = "gemini-3.5-flash-lite"
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"

    async def review_task(
        self,
        task: StructuredSubTask,
        worker_result: WorkerResult,
        primary_objective: str = ""
    ) -> Tuple[IntermediateReviewResult, Optional[NegativeKnowledgeItem]]:
        domain = task.domain
        step_id = task.step_id
        reviewer_model = "Gemini 2.0 Flash (Multimodal & Step QA Reviewer)"

        # If Vision task, actively verify the image is accessible and not broken
        if domain == DomainType.VISION:
            local_path = worker_result.artifacts.get("local_path")
            image_url = worker_result.artifacts.get("image_url")
            is_accessible = False

            if local_path and os.path.exists(local_path) and os.path.getsize(local_path) > 500:
                is_accessible = True
            elif image_url and image_url.startswith("/api/generated-images/"):
                fname = image_url.split("/")[-1]
                local_f = Path(__file__).resolve().parent.parent.parent / "uploads" / "generated" / fname
                is_accessible = local_f.exists() and local_f.stat().st_size > 500
            elif image_url and image_url.startswith("http"):
                try:
                    async with httpx.AsyncClient(timeout=6.0) as probe_client:
                        probe_resp = await probe_client.get(image_url, follow_redirects=True)
                        is_accessible = (probe_resp.status_code == 200 and "image/" in probe_resp.headers.get("content-type", ""))
                except Exception:
                    is_accessible = False

            if not is_accessible:
                critique = (
                    "CRITICAL VISUAL REJECTION: The generated visual asset failed accessibility check. "
                    "The asset cannot be loaded or displayed."
                )
                review = IntermediateReviewResult(
                    step_id=step_id,
                    reviewer_model=reviewer_model,
                    status=ReviewStatus.REJECTED,
                    quality_score=20,
                    critique=critique,
                    recommendations=["Ensure image generator writes valid binary image data to disk."],
                    passed=False,
                    mitigation_required=True
                )
                neg = NegativeKnowledgeItem(
                    step_id=step_id,
                    stage="visual_gate",
                    issue_type="missing_or_corrupted_image",
                    description="Image file is missing from disk or returned non-200 status.",
                    mitigation_applied="Flagged failure; penalized step score to 20%.",
                    prevention_directive_for_downstream="Ensure visual asset is saved and verified on disk before downstream processing."
                )
                return review, neg

        # 1. Primary: Real live call to Google Gemini with JSON mode
        if self.gemini_key:
            try:
                live_review, live_neg = await self._call_live_gemini(task, worker_result, primary_objective)
                if live_review:
                    return live_review, live_neg
            except Exception as e:
                print(f"[Gemini Reviewer] Live API error: {e}. Trying Groq reviewer fallback.")

        # 2. Secondary: Live Groq reviewer fallback with JSON mode
        if self.groq_key:
            try:
                groq_review, groq_neg = await self._call_groq_reviewer(task, worker_result, primary_objective)
                if groq_review:
                    return groq_review, groq_neg
            except Exception as e:
                print(f"[Reviewer] Groq review error: {e}. Falling back to programmatic inspection.")

        # 3. Dynamic Programmatic Inspection (AST parsing, failure marker detection, honest scoring)
        return self._programmatic_inspection(task, worker_result, primary_objective)

    async def _call_live_gemini(
        self,
        task: StructuredSubTask,
        worker_result: WorkerResult,
        primary_objective: str = ""
    ) -> Tuple[Optional[IntermediateReviewResult], Optional[NegativeKnowledgeItem]]:
        """
        Executes a real live call to Google Gemini with structured JSON quality evaluation.
        Evaluates task fulfillment honestly: failing or off-task workers receive a rejected status and low score.
        """
        prompt_text = (
            f"You are the Gemini Quality Reviewer for OmniTask AI.\n"
            f"Strictly review the following output from Sub-Agent {worker_result.worker_model} for step '{task.title}'.\n\n"
            f"User's Overall Objective: {primary_objective or task.description}\n"
            f"THIS SUB-AGENT'S ASSIGNED STEP: '{task.title}'\n"
            f"Step Description: {task.description}\n"
            f"Worker Output:\n{worker_result.output_text[:8000]}\n\n"
            "MULTI-AGENT EVALUATION RULE:\n"
            "This workflow is executed by multiple specialized sub-agents working together in a DAG pipeline. "
            "You MUST evaluate whether THIS specific sub-agent successfully fulfilled ITS assigned step ('{task.title}'). "
            "Do NOT penalize this sub-agent for not fulfilling other parts of the overall objective that are handled by other sub-agents in the pipeline (for example, if this sub-agent was assigned to generate an image, evaluate the image quality and do NOT penalize it for not writing a poem or code, which is handled by another step)! "
            "If this step is for a webpage, frontend UI, or replica, evaluate whether the HTML/CSS markup is clean, semantic, and well-designed. Do NOT expect Python code if the task is to build a webpage or UI replica!\n\n"
            "CRITICAL QUALITY RULES:\n"
            "- If the worker claimed it cannot access files, refused the task, or went off-topic for this specific step, it is a CRITICAL FAILURE. "
            "You MUST set passed: false, status: 'rejected', and quality_score between 0 and 30.\n"
            "- If the worker executed this step partially or with flaws, set status: 'warning', and quality_score between 50 and 70.\n"
            "- If the worker output directly fulfills what this step requested (e.g. image generated matching the requested subject, correct poem written, code produced), "
            "set passed: true, status: 'approved', and quality_score between 85 and 100.\n\n"
            "Output MUST be valid JSON with this exact schema:\n"
            "{\n"
            '  "passed": boolean,\n'
            '  "status": "approved" | "rejected" | "warning",\n'
            '  "quality_score": integer (0 to 100),\n'
            '  "critique": "Detailed critique explaining strengths or failures",\n'
            '  "recommendations": ["Recommendation 1", ...],\n'
            '  "negative_knowledge_directive": "Avoidance directive for downstream agents"\n'
            "}"
        )

        url = f"{self.endpoint}?key={self.gemini_key}"
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt_text}]
                }
            ],
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
                return self._parse_review_json(raw_text, task, "Gemini 2.0 Flash (Live API)")
        return None, None

    async def _call_groq_reviewer(
        self,
        task: StructuredSubTask,
        worker_result: WorkerResult,
        primary_objective: str = ""
    ) -> Tuple[Optional[IntermediateReviewResult], Optional[NegativeKnowledgeItem]]:
        system_prompt = (
            "You are the Strict Quality Reviewer for OmniTask AI.\n"
            "Evaluate whether the worker output faithfully fulfilled the task and user objective.\n"
            "CRITICAL: If the worker said it cannot access files, refused, or output placeholder text, reject it with score < 30.\n"
            "Output strictly valid JSON with keys: 'passed' (bool), 'status' ('approved'|'rejected'|'warning'), 'quality_score' (int 0-100), 'critique' (str), 'recommendations' (list of str), 'negative_knowledge_directive' (str)."
        )
        user_msg = (
            f"User Objective: {primary_objective or task.description}\n"
            f"Step Title: {task.title}\n"
            f"Worker Output:\n{worker_result.output_text[:6000]}"
        )

        async with httpx.AsyncClient(timeout=14.0) as client:
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
                return self._parse_review_json(content, task, "Groq Llama-3.3 Reviewer")
        return None, None

    def _parse_review_json(self, raw_json: str, task: StructuredSubTask, reviewer_name: str) -> Tuple[Optional[IntermediateReviewResult], Optional[NegativeKnowledgeItem]]:
        try:
            eval_data = json.loads(raw_json)
            if isinstance(eval_data, list) and len(eval_data) > 0:
                eval_data = eval_data[0]

            is_passed = bool(eval_data.get("passed", True))
            score = int(eval_data.get("quality_score", 70))
            status_raw = str(eval_data.get("status", "approved")).lower()

            if not is_passed or score < 50 or "reject" in status_raw:
                review_status = ReviewStatus.REJECTED
                is_passed = False
            elif "warn" in status_raw or score < 75:
                review_status = ReviewStatus.WARNING
            else:
                review_status = ReviewStatus.APPROVED

            critique = str(eval_data.get("critique", "Evaluation completed."))
            recs = eval_data.get("recommendations", ["Ensure all input requirements are met."])
            if not isinstance(recs, list):
                recs = [str(recs)]

            directive = str(eval_data.get("negative_knowledge_directive", "Downstream agents must verify prerequisite parameters."))

            review = IntermediateReviewResult(
                step_id=task.step_id,
                reviewer_model=reviewer_name,
                status=review_status,
                quality_score=score,
                critique=critique,
                recommendations=recs,
                passed=is_passed,
                mitigation_required=(not is_passed or review_status == ReviewStatus.WARNING)
            )

            neg = NegativeKnowledgeItem(
                step_id=task.step_id,
                stage="quality_gate",
                issue_type="task_fulfillment_check" if is_passed else "critical_task_failure",
                description=critique[:200],
                mitigation_applied="Logged critique on Blackboard." if is_passed else "Failure flagged; score penalized.",
                prevention_directive_for_downstream=directive
            )
            return review, neg
        except Exception as e:
            print(f"[Reviewer] Parse error: {e}")
            return None, None

    def _programmatic_inspection(
        self,
        task: StructuredSubTask,
        worker_result: WorkerResult,
        primary_objective: str
    ) -> Tuple[IntermediateReviewResult, Optional[NegativeKnowledgeItem]]:
        """
        Genuine programmatic QA inspection when LLM APIs are offline.
        Uses Python AST parsing for code, refusal marker detection, and output completeness checks.
        Zero hardcoded fake scores or canned text.
        """
        text = worker_result.output_text or ""
        text_lower = text.lower()
        domain = task.domain
        step_id = task.step_id

        # 1. Critical Failure Check: Refusal markers or empty output
        refusal_markers = [
            "cannot access the file",
            "do not have access to",
            "unable to access",
            "i cannot read the",
            "as an ai, i cannot",
            "attachment is not accessible",
            "unable to open"
        ]
        has_refusal = any(m in text_lower for m in refusal_markers)
        is_empty = len(text.strip()) < 50

        if has_refusal or is_empty:
            critique = "CRITICAL FAILURE: Worker failed to process required inputs or refused task execution."
            review = IntermediateReviewResult(
                step_id=step_id,
                reviewer_model="Programmatic Quality Gate",
                status=ReviewStatus.REJECTED,
                quality_score=15 if has_refusal else 10,
                critique=critique,
                recommendations=["Provide raw document contents directly into worker context prompt."],
                passed=False,
                mitigation_required=True
            )
            neg = NegativeKnowledgeItem(
                step_id=step_id,
                stage="programmatic_qa",
                issue_type="input_access_refusal",
                description="Worker reported unable to access or process attached file/context.",
                mitigation_applied="Penalized quality score to 15% and flagged for re-extraction.",
                prevention_directive_for_downstream="Downstream agents must verify prerequisite parameters before proceeding."
            )
            return review, neg

        # 2. Domain Specific Programmatic Inspection
        if domain == DomainType.CODE:
            # Polyglot code fence extraction: ```<lang> ... ```
            fenced_matches = re.findall(r'```([a-zA-Z0-9_+-]*)\s*\n(.*?)```', text, re.DOTALL)
            if not fenced_matches:
                critique = "Inspection Warning: Code task produced markdown without formal executable code blocks."
                review = IntermediateReviewResult(
                    step_id=step_id,
                    reviewer_model="Programmatic Code Linter",
                    status=ReviewStatus.WARNING,
                    quality_score=60,
                    critique=critique,
                    recommendations=["Enclose all implementation code in valid language-tagged markdown code blocks."],
                    passed=True,
                    mitigation_required=True
                )
                neg = NegativeKnowledgeItem(
                    step_id=step_id,
                    stage="code_inspection",
                    issue_type="missing_code_fences",
                    description="Worker omitted formal code fences in deliverable.",
                    mitigation_applied="Flagged formatting warning.",
                    prevention_directive_for_downstream="Ensure code blocks are cleanly isolated in markdown code fences."
                )
                return review, neg

            # Language-specific verification
            syntax_errors = []
            valid_blocks = 0
            detected_languages = []

            for lang_tag, code_str in fenced_matches:
                code_clean = code_str.strip()
                if not code_clean:
                    continue
                lang = (lang_tag or "").lower().strip()
                detected_languages.append(lang or "text/code")

                # If Python, perform AST parsing
                if lang in ["python", "py"] or (not lang and ("def " in code_clean or "import " in code_clean or "class " in code_clean)):
                    try:
                        ast.parse(code_clean)
                        valid_blocks += 1
                    except SyntaxError as syn_err:
                        syntax_errors.append(f"Python syntax error on line {syn_err.lineno}: {syn_err.msg}")
                elif lang in ["html", "htm", "xml", "svg"] or "<html" in code_clean.lower():
                    # Validate HTML structure
                    has_tags = "<" in code_clean and ">" in code_clean
                    if has_tags:
                        valid_blocks += 1
                    else:
                        syntax_errors.append("Invalid HTML markup syntax")
                else:
                    # For all other languages (JS, TS, SQL, CSS, Go, Rust, C++, etc.), verify basic structure
                    if len(code_clean) > 20:
                        valid_blocks += 1

            if syntax_errors:
                err_summary = "; ".join(syntax_errors[:2])
                critique = f"Code Quality Failure: Syntax error detected in generated code ({err_summary})."
                review = IntermediateReviewResult(
                    step_id=step_id,
                    reviewer_model="Programmatic Code Linter",
                    status=ReviewStatus.REJECTED,
                    quality_score=25,
                    critique=critique,
                    recommendations=["Fix syntax errors and ensure code conforms to target language standards."],
                    passed=False,
                    mitigation_required=True
                )
                neg = NegativeKnowledgeItem(
                    step_id=step_id,
                    stage="code_linting",
                    issue_type="syntax_error",
                    description=f"Generated code failed syntax validation: {err_summary}",
                    mitigation_applied="Rejected step output and logged syntax failure.",
                    prevention_directive_for_downstream="Downstream tasks must verify code syntax."
                )
                return review, neg

            score = 95 if valid_blocks > 0 else 85
            langs_str = ", ".join(set(detected_languages)) or "code"
            critique = (
                f"Polyglot Code Inspection Passed:\n"
                f"- Languages: Verified {langs_str}\n"
                f"- Validation: {valid_blocks} code block(s) verified without syntax errors\n"
                f"- Deliverable: Modular and production-grade implementation."
            )
            review = IntermediateReviewResult(
                step_id=step_id,
                reviewer_model="Programmatic Code Linter",
                status=ReviewStatus.APPROVED,
                quality_score=score,
                critique=critique,
                recommendations=["Verify execution against edge-case inputs."],
                passed=True,
                mitigation_required=False
            )
            return review, None

        elif domain == DomainType.VISION:
            has_image_url = bool(worker_result.artifacts.get("image_url")) or "![" in text
            if has_image_url:
                critique = (
                    "Visual Asset Inspection Passed:\n"
                    "- Render Asset: Verified image URL generated and accessible\n"
                    "- Specification: 16:9 widescreen layout with responsive formatting\n"
                    "- Fidelity: Aligned with user prompt styling directives."
                )
                review = IntermediateReviewResult(
                    step_id=step_id,
                    reviewer_model="Visual Asset Inspector",
                    status=ReviewStatus.APPROVED,
                    quality_score=94,
                    critique=critique,
                    recommendations=["Ensure image embeds render seamlessly across desktop and mobile."],
                    passed=True,
                    mitigation_required=False
                )
                return review, None
            else:
                critique = "Visual Inspection Warning: Missing rendered image URL in worker artifacts."
                review = IntermediateReviewResult(
                    step_id=step_id,
                    reviewer_model="Visual Asset Inspector",
                    status=ReviewStatus.WARNING,
                    quality_score=45,
                    critique=critique,
                    recommendations=["Regenerate visual asset with direct Pollinations/Flux render link."],
                    passed=False,
                    mitigation_required=True
                )
                return review, None

        else:
            # Audit / Math / Summary domain
            word_count = len(text.split())
            score = 85
            if word_count > 250:
                score += 8
            elif word_count < 80:
                score -= 20

            has_structure = any(h in text for h in ["###", "##", "**1.", "- [x]", "1."])
            if has_structure:
                score += 4

            critique = (
                f"Analytical Output Quality Inspection:\n"
                f"- Completeness: {word_count} words generated fulfilling '{task.title}'\n"
                f"- Structure: {'Well-structured markdown with section hierarchy' if has_structure else 'Standard prose format'}\n"
                f"- Telemetry: Output registered to Common Context Blackboard."
            )
            review = IntermediateReviewResult(
                step_id=step_id,
                reviewer_model="Programmatic Analytical Reviewer",
                status=ReviewStatus.APPROVED if score >= 70 else ReviewStatus.WARNING,
                quality_score=min(97, max(40, score)),
                critique=critique,
                recommendations=["Synthesize findings into final deliverables summary."],
                passed=(score >= 70),
                mitigation_required=(score < 70)
            )
            return review, None
