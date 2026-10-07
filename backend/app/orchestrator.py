import asyncio
import json
import uuid
from typing import AsyncGenerator, Dict, Any, List
from app.models.schemas import (
    TaskRequest,
    TaskStatus,
    BlackboardState,
    FinalEvaluationResult,
    DomainType,
)
from app.core.structurer import JSONStructurerAgent
from app.core.jev_router import JevFastRouter
from app.core.blackboard import CommonContextBlackboard
from app.workers.worker_pool import WorkerPool
from app.reviewers.review_engine import IntermediateReviewEngine
from app.core.evaluator import FinalEvaluationAgent

class OmniOrchestrator:
    """
    Main autonomous orchestrator for Track 2.
    Executes the entire multi-agent loop with streaming event telemetry.
    """
    def __init__(self):
        self.structurer = JSONStructurerAgent()
        self.jev_router = JevFastRouter()
        self.worker_pool = WorkerPool()
        self.review_engine = IntermediateReviewEngine()
        self.evaluator = FinalEvaluationAgent()

    async def execute_stream(self, request: TaskRequest) -> AsyncGenerator[str, None]:
        session_id = f"omni_{uuid.uuid4().hex[:8]}"

        # Construct effective prompt including user-approved plan and clarifications
        effective_prompt = request.prompt
        clarifications_list = []
        if request.user_clarifications:
            for q, a in request.user_clarifications.items():
                if a and a.strip():
                    clarifications_list.append(f"{q}: {a.strip()}")
        
        if clarifications_list:
            effective_prompt += "\n\n[USER APPROVED CLARIFICATIONS & SPECIFICATIONS]:\n" + "\n".join([f"- {c}" for c in clarifications_list])

        if request.approved_plan_summary:
            effective_prompt += f"\n\n[USER APPROVED ARCHITECTURE PLAN]:\n{request.approved_plan_summary}"

        # --- STEP 1: PARSING & STRUCTURING ---
        yield self._format_sse("STAGE_CHANGE", {
            "stage": "STRUCTURING",
            "message": "JSON Structurer Agent normalizing prompt, preferences, and ingested assets...",
            "session_id": session_id
        })
        await asyncio.sleep(0.4)

        if request.user_clarifications:
            yield self._format_sse("USER_PREFERENCES_APPLIED", {
                "clarifications": request.user_clarifications,
                "plan_summary": request.approved_plan_summary or ""
            })

        structured_goal = await self.structurer.structure_async(effective_prompt, request.files)
        yield self._format_sse("STRUCTURING_COMPLETED", {
            "structured_goal": structured_goal.model_dump()
        })

        # --- STEP 2: JEV FAST SYSTEM 1 ROUTING ---
        yield self._format_sse("STAGE_CHANGE", {
            "stage": "JEV_ROUTING",
            "message": "Invoking Jev Fast System 1 Router for deterministic sub-task DAG classification...",
            "session_id": session_id
        })
        await asyncio.sleep(0.3)

        routed_plan = await self.jev_router.route_plan_async(structured_goal)
        yield self._format_sse("JEV_ROUTING_COMPLETED", {
            "routed_plan": routed_plan.model_dump(),
            "latency_ms": routed_plan.jev_routing_latency_ms,
            "confidence": routed_plan.jev_confidence
        })

        # --- STEP 3: INITIALIZE COMMON CONTEXT BLACKBOARD ---
        blackboard = CommonContextBlackboard(session_id, effective_prompt)
        blackboard.set_structured_goal(routed_plan, request.files)

        yield self._format_sse("BLACKBOARD_INITIALIZED", {
            "session_id": session_id,
            "prerequisites": blackboard.global_prerequisites,
            "tasks_count": len(routed_plan.sub_tasks)
        })

        # --- STEP 4: SUB-AGENT EXECUTION & STEP QA GATES ---
        for task in routed_plan.sub_tasks:
            step_id = task.step_id
            blackboard.current_step_id = step_id

            # Emit Sub-agent Start
            yield self._format_sse("SUBAGENT_STARTED", {
                "step_id": step_id,
                "title": task.title,
                "domain": task.domain,
                "assigned_worker": task.assigned_worker_model,
                "assigned_reviewer": task.assigned_reviewer_model,
                "status": TaskStatus.IN_PROGRESS
            })

            # Fetch context from Blackboard (zero cold-start)
            context_packet = blackboard.get_context_for_subagent(step_id)
            yield self._format_sse("CONTEXT_INJECTED", {
                "step_id": step_id,
                "prior_outputs_count": len(context_packet.get("cumulative_prior_outputs", {})),
                "avoidance_rules": context_packet.get("negative_knowledge_avoidance_rules", [])
            })

            await asyncio.sleep(0.6)

            # Worker executes
            worker_result = await self.worker_pool.execute_task(task, context_packet)
            yield self._format_sse("WORKER_COMPLETED", {
                "step_id": step_id,
                "worker_result": worker_result.model_dump()
            })

            # Intermediate Reviewer inspects output
            yield self._format_sse("INTERMEDIATE_REVIEW_STARTED", {
                "step_id": step_id,
                "reviewer_model": task.assigned_reviewer_model,
                "domain": task.domain
            })

            await asyncio.sleep(0.5)

            review_result, negative_knowledge = await self.review_engine.review_task(
                task,
                worker_result,
                primary_objective=blackboard.original_prompt,
                prior_outputs=context_packet.get("cumulative_prior_outputs", {}),
                cumulative_handovers=context_packet.get("cumulative_handovers", {})
            )

            # Autonomous Self-Correction Loop:
            # If reviewer marks score < 85% or passed is False, regenerate with new prompt from reviewer (max 5 times)
            attempt = 1
            max_attempts = 5
            task.retry_count = 0

            while (review_result.quality_score < 85 or not review_result.passed) and attempt < max_attempts:
                attempt += 1
                task.retry_count = attempt - 1
                critique_note = review_result.critique or "Quality score fell below required 85% threshold."
                
                # Sanitize diffusion prompts: NEVER pass technical review/accessibility rejection jargon into visual models
                is_visual_task = task.domain in [DomainType.VISION, DomainType.VIDEO] or "flux" in (task.assigned_worker_model or "").lower()
                if is_visual_task:
                    candidate = (review_result.reviewer_regenerate_prompt or "").strip()
                    has_error_jargon = any(err in candidate.lower() for err in ["rejection", "failed", "accessibility", "error", "critic", "penaliz", "status", "threshold", "corrupted"])
                    if candidate and not has_error_jargon:
                        regen_prompt = candidate
                    else:
                        regen_prompt = task.description
                else:
                    regen_prompt = review_result.reviewer_regenerate_prompt or f"{task.description}. Specifically rectify: {critique_note}"

                retry_avoidance = f"SELF-CORRECTION ATTEMPT {attempt}/{max_attempts}: Prior attempt scored {review_result.quality_score}%. Reviewer critique: {critique_note}. Regenerate strictly following: {regen_prompt}"
                if "negative_knowledge_avoidance_rules" not in context_packet:
                    context_packet["negative_knowledge_avoidance_rules"] = []
                context_packet["negative_knowledge_avoidance_rules"].append(retry_avoidance)

                if negative_knowledge:
                    blackboard.append_negative_knowledge(negative_knowledge)

                yield self._format_sse("STEP_RETRY_INITIATED", {
                    "step_id": step_id,
                    "title": task.title,
                    "attempt": attempt,
                    "max_attempts": max_attempts,
                    "quality_score": review_result.quality_score,
                    "rejection_critique": critique_note,
                    "reviewer_prompt": regen_prompt,
                    "action": f"Auto-correction {attempt}/{max_attempts}: Regenerating with Reviewer prompt..."
                })

                await asyncio.sleep(0.6)

                try:
                    # Re-execute worker using the new prompt from the reviewer
                    worker_result = await self.worker_pool.execute_task(
                        task,
                        context_packet,
                        override_prompt=regen_prompt,
                        attempt=attempt
                    )
                except Exception as w_err:
                    print(f"[Orchestrator] Worker error during retry {attempt} on {task.title}: {w_err}")
                
                yield self._format_sse("WORKER_COMPLETED", {
                    "step_id": step_id,
                    "worker_result": worker_result.model_dump(),
                    "is_retry": True,
                    "attempt": attempt
                })

                try:
                    # Re-review deliverable
                    review_result, negative_knowledge = await self.review_engine.review_task(
                        task,
                        worker_result,
                        primary_objective=blackboard.original_prompt,
                        prior_outputs=context_packet.get("cumulative_prior_outputs", {}),
                        cumulative_handovers=context_packet.get("cumulative_handovers", {})
                    )
                except Exception as r_err:
                    print(f"[Orchestrator] Review error during retry {attempt} on {task.title}: {r_err}")

            # If work is still not done (< 85%) after 5 tries, emit error message
            if review_result.quality_score < 85 or not review_result.passed:
                task.status = TaskStatus.FAILED
                error_msg = f"ERROR: Step '{task.title}' failed to achieve 85% quality score after {max_attempts} attempts. Final score: {review_result.quality_score}%. Critique: {review_result.critique}"
                yield self._format_sse("STEP_MAX_RETRIES_EXCEEDED", {
                    "step_id": step_id,
                    "title": task.title,
                    "attempts": max_attempts,
                    "final_score": review_result.quality_score,
                    "error_message": error_msg
                })
            else:
                task.status = TaskStatus.COMPLETED

            # Commit to Blackboard
            blackboard.record_worker_output(step_id, worker_result)
            blackboard.record_intermediate_review(step_id, review_result)

            if negative_knowledge:
                blackboard.append_negative_knowledge(negative_knowledge)

            yield self._format_sse("INTERMEDIATE_REVIEW_COMPLETED", {
                "step_id": step_id,
                "review_result": review_result.model_dump(),
                "negative_knowledge_logged": negative_knowledge.model_dump() if negative_knowledge else None,
                "blackboard_snapshot": blackboard.get_state().model_dump()
            })

            await asyncio.sleep(0.3)

        # --- STEP 5: FINAL EVALUATION & COMPLETION SCORING ---
        yield self._format_sse("STAGE_CHANGE", {
            "stage": "FINAL_EVALUATION",
            "message": "Final Evaluation Agent computing task completion score & assembling deliverables...",
            "session_id": session_id
        })
        await asyncio.sleep(0.5)

        delivery_mode = getattr(request, "delivery_mode", "overdeliver") or "overdeliver"
        evaluation = self.evaluator.evaluate(blackboard.get_state(), delivery_mode=delivery_mode)
        yield self._format_sse("EXECUTION_COMPLETED", {
            "session_id": session_id,
            "final_evaluation": evaluation.model_dump(),
            "full_blackboard_state": blackboard.get_state().model_dump()
        })

    def _format_sse(self, event_name: str, data: Dict[str, Any]) -> str:
        payload = {
            "event": event_name,
            "data": data
        }
        return f"event: message\ndata: {json.dumps(payload)}\n\n"
