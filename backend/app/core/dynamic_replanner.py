import json
import re
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    StructuredSubTask,
    WorkerResult,
    IntermediateReviewResult,
    DomainType,
    TaskStatus,
)

class DynamicSwarmReplanner:
    """
    Adaptive Dynamic Multi-Agent Swarm Replanner.
    Monitors in-flight execution and intermediate QA reviews.
    When an output indicates missing depth, critical flaws, or specialized complementary
    requirements, this engine dynamically injects new AI specialist sub-agents into the DAG.
    
    Strict Guardrails:
    - Never hallucinates or duplicates existing work.
    - Limits total dynamic expansions per session (default: max 2).
    - Checks remaining tasks to prevent duplicate or redundant agent insertion.
    - Provides downstream AI agents with adapted context and continuity directives.
    """
    def __init__(self, max_dynamic_additions: int = 2):
        self.max_dynamic_additions = max_dynamic_additions
        self.worker_dispatch_table = {
            DomainType.CODE: "Qwen 2.5 Coder (via Groq Cloud)",
            DomainType.AUDIT: "OpenAI GPT (Auditing Specialist)",
            DomainType.MATH: "Mistral (Legal & Formal Logic Specialist)",
            DomainType.VISION: "Flux.1 (Visual Asset Specialist)",
            DomainType.AUDIO: "Meta MusicGen & Suno AI (Music & Audio Specialist)",
            DomainType.VIDEO: "Kling AI & CogVideoX (Motion & Video Specialist)",
        }

    def evaluate_dynamic_expansion(
        self,
        current_task: StructuredSubTask,
        worker_result: WorkerResult,
        review_result: IntermediateReviewResult,
        primary_objective: str,
        prior_outputs: Dict[str, Any],
        remaining_tasks: List[StructuredSubTask],
        dynamically_added_count: int = 0
    ) -> Optional[StructuredSubTask]:
        """
        Evaluates whether an additional specialist AI should be dynamically inserted
        into the workflow immediately following the current task.
        """
        # Guardrail 1: Enforce maximum dynamic expansions per session
        if dynamically_added_count >= self.max_dynamic_additions:
            return None

        # Guardrail 2: Do not recursively expand dynamically added tasks
        if getattr(current_task, "is_dynamically_added", False):
            return None

        output_text = worker_result.output_text or ""
        critique = (review_result.critique or "").lower()
        recs = [r.lower() for r in (review_result.recommendations or [])]
        combined_review_feedback = f"{critique} {' '.join(recs)}"

        # -------------------------------------------------------------
        # 1. DIRECT REVIEWER-REQUESTED ADDITIONAL AGENT
        # -------------------------------------------------------------
        if review_result.requires_additional_agent and review_result.additional_agent_spec:
            spec = review_result.additional_agent_spec
            domain_raw = str(spec.get("domain", "audit")).lower()
            try:
                target_domain = DomainType(domain_raw)
            except ValueError:
                target_domain = DomainType.AUDIT

            title = spec.get("title") or f"Supplementary Specialist for {current_task.title}"
            reason = spec.get("reason") or "QA Reviewer requested specialized supplementary sub-agent."
            directive = spec.get("directive") or spec.get("description") or f"Address gaps identified in {current_task.step_id}"

            # Ensure capability not already pending in remaining tasks
            if not self._is_capability_already_scheduled(target_domain, title, remaining_tasks):
                return self._create_dynamic_subtask(
                    current_task=current_task,
                    title=title,
                    domain=target_domain,
                    reason=reason,
                    directive=directive,
                    expected_output_type=spec.get("expected_output_type", "supplementary_deliverable"),
                    primary_objective=primary_objective,
                    worker_result=worker_result
                )

        # -------------------------------------------------------------
        # 2. HEURISTIC & CRITIQUE-TRIGGERED SPECIALIST INJECTION
        # -------------------------------------------------------------

        # Check A: Formal Mathematical / Statistical Proof Gap
        math_gap_triggers = [
            "mathematical derivation", "formula proof", "numerical verification",
            "calculation check", "boundary condition proof", "formal logic verification"
        ]
        has_math_gap = any(t in combined_review_feedback for t in math_gap_triggers)
        if has_math_gap and not self._is_domain_in_remaining(DomainType.MATH, remaining_tasks):
            return self._create_dynamic_subtask(
                current_task=current_task,
                title=f"Rigorous Mathematical Verification & Proof Polish",
                domain=DomainType.MATH,
                reason="Review identified need for rigorous numerical and formal mathematical derivation verification.",
                directive="Verify all equations, numerical steps, and mathematical proofs from the previous solutions. Provide explicit derivations and error-free step-by-step calculations.",
                expected_output_type="mathematical_verification_markdown",
                primary_objective=primary_objective,
                worker_result=worker_result
            )

        # Check B: Edge-Case & Technical Audit Depth Gap (when solutions have critiques)
        audit_gap_triggers = [
            "missing edge case", "superficial answer", "deeper technical explanation",
            "incomplete answer to question", "unaddressed sub-question", "truncate"
        ]
        has_audit_gap = any(t in combined_review_feedback for t in audit_gap_triggers) or (review_result.quality_score < 88 and "comprehensive" in primary_objective.lower())
        if has_audit_gap and current_task.domain == DomainType.AUDIT and not self._is_step_title_in_remaining("edge-case", remaining_tasks):
            return self._create_dynamic_subtask(
                current_task=current_task,
                title=f"Technical Edge-Case & Exhaustive Solution Polish",
                domain=DomainType.AUDIT,
                reason="Review identified specific sub-questions or technical edge cases requiring exhaustive technical depth.",
                directive="Exhaustively address all edge cases, missing sub-questions, and deep technical clarifications noted in the review without rewriting existing valid answers.",
                expected_output_type="solutions_refinement_markdown",
                primary_objective=primary_objective,
                worker_result=worker_result
            )

        # Check C: Code Implementation / Refactor Gap
        code_gap_triggers = [
            "missing code implementation", "needs runnable code", "script implementation missing",
            "code example required", "missing python script"
        ]
        has_code_gap = any(t in combined_review_feedback for t in code_gap_triggers)
        if has_code_gap and not self._is_domain_in_remaining(DomainType.CODE, remaining_tasks):
            return self._create_dynamic_subtask(
                current_task=current_task,
                title=f"Executable Code & Script Implementation Specialist",
                domain=DomainType.CODE,
                reason="Review identified that practical runnable code implementation was required to accompany the theoretical findings.",
                directive="Implement complete, functional, production-ready code fulfilling the programmatic requirements identified in the preceding review.",
                expected_output_type="executable_code",
                primary_objective=primary_objective,
                worker_result=worker_result
            )

        # Check D: Pre-Publishing Editorial & Layout Verification (Before PDF compilation)
        # If the next task is PDF compilation and the current task produced rich multi-page solutions
        is_next_task_pdf = (
            len(remaining_tasks) > 0 and 
            ("pdf & document publishing specialist" in remaining_tasks[0].assigned_worker_model.lower() or
             remaining_tasks[0].expected_output_type in ["pdf_document", "pdf_deliverable"])
        )
        if is_next_task_pdf and review_result.quality_score < 90 and len(output_text) > 3000:
            return self._create_dynamic_subtask(
                current_task=current_task,
                title="Pre-Publication Editorial QA & Technical Polish",
                domain=DomainType.AUDIT,
                reason="Quality gate identified opportunities for structural refinement and formatting polish before final publication compilation.",
                directive="Perform rigorous technical polishing on the solutions: standardize question labels (Q1, Q2, etc.), refine technical explanations, and format cleanly for publication.",
                expected_output_type="editorial_polish_markdown",
                primary_objective=primary_objective,
                worker_result=worker_result
            )

        return None

    def _is_capability_already_scheduled(self, domain: DomainType, title: str, remaining_tasks: List[StructuredSubTask]) -> bool:
        t_lower = title.lower()
        for t in remaining_tasks:
            if t.domain == domain and any(w in t.title.lower() for w in t_lower.split() if len(w) > 4):
                return True
        return False

    def _is_domain_in_remaining(self, domain: DomainType, remaining_tasks: List[StructuredSubTask]) -> bool:
        return any(t.domain == domain for t in remaining_tasks)

    def _is_step_title_in_remaining(self, keyword: str, remaining_tasks: List[StructuredSubTask]) -> bool:
        kw = keyword.lower()
        return any(kw in t.title.lower() or kw in t.description.lower() for t in remaining_tasks)

    def _create_dynamic_subtask(
        self,
        current_task: StructuredSubTask,
        title: str,
        domain: DomainType,
        reason: str,
        directive: str,
        expected_output_type: str,
        primary_objective: str,
        worker_result: WorkerResult
    ) -> StructuredSubTask:
        new_step_id = f"{current_task.step_id}_expansion"
        assigned_worker = self.worker_dispatch_table.get(domain, "OpenAI GPT (Auditing Specialist)")
        assigned_reviewer = "Gemini 2.0 Flash (Multimodal & Step QA Reviewer)"

        prior_snippet = (worker_result.output_text or "")[:1200].replace("\n", " ")

        scoped_description = (
            f"=== ADAPTIVE SWARM DYNAMIC INJECTION: {title} ===\n"
            f"REASON FOR INJECTION: {reason}\n\n"
            f"WORK ALREADY COMPLETED BY PRECEDING AGENT ({current_task.assigned_worker_model}):\n"
            f"\"{prior_snippet}...\"\n\n"
            f"YOUR EXACT TARGET OBJECTIVE:\n"
            f"{directive}\n\n"
            f"CRITICAL BOUNDARY INSTRUCTIONS:\n"
            f"- Focus strictly on your designated scope: {directive}.\n"
            f"- DO NOT duplicate or re-write the general valid content already produced by {current_task.step_id}.\n"
            f"- DO NOT perform downstream compilation tasks (e.g. compiling the final PDF or closing the project).\n"
            f"- Output your verified supplementary deliverable cleanly for integration by downstream agents."
        )

        return StructuredSubTask(
            step_id=new_step_id,
            title=title,
            domain=domain,
            description=scoped_description,
            assigned_worker_model=assigned_worker,
            assigned_reviewer_model=assigned_reviewer,
            required_prerequisites=[current_task.step_id],
            expected_output_type=expected_output_type,
            status=TaskStatus.PENDING,
            is_dynamically_added=True,
            dynamic_insertion_reason=reason,
            parent_step_id=current_task.step_id
        )

    def format_downstream_continuity_context(
        self,
        dynamically_inserted_tasks: List[StructuredSubTask],
        blackboard_completed_outputs: Dict[str, Any]
    ) -> str:
        """
        Creates an explicit, adapted continuity directive for subsequent AI agents
        explaining what additional work was completed by dynamic specialists and
        how they must incorporate it into their deliverables.
        """
        if not dynamically_inserted_tasks:
            return ""

        summary_blocks = []
        for dt in dynamically_inserted_tasks:
            res = blackboard_completed_outputs.get(dt.step_id)
            if res:
                text = getattr(res, "output_text", "") if hasattr(res, "output_text") else res.get("output_text", "")
                snippet = text[:350].replace("\n", " ").strip()
                summary_blocks.append(
                    f"- **Specialist [{dt.title}]** ({dt.assigned_worker_model}):\n"
                    f"  * Purpose: {dt.dynamic_insertion_reason}\n"
                    f"  * Key Work Accomplished: \"{snippet}...\""
                )

        if not summary_blocks:
            return ""

        return (
            "\n\n[ADAPTIVE WORKFLOW CONTINUITY - DYNAMIC SPECIALIST HANDOVER]\n"
            "The multi-agent workflow dynamically injected complementary AI specialist(s) to augment quality:\n"
            + "\n".join(summary_blocks) + "\n\n"
            "YOUR EXECUTION CONTINUITY DIRECTIVE:\n"
            "- The work above is completed and verified on the Common Context Blackboard.\n"
            "- You MUST seamlessly integrate BOTH the original stage outputs AND the dynamic specialist enhancements above.\n"
            "- Ensure 100% cohesion in your final deliverable without gaps or contradictions."
        )
