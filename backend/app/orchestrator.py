import asyncio
import json
import uuid
from typing import AsyncGenerator, Dict, Any, List
from app.models.schemas import (
    TaskRequest,
    TaskStatus,
    BlackboardState,
    FinalEvaluationResult,
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
                task, worker_result, primary_objective=blackboard.original_prompt
            )

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

        evaluation = self.evaluator.evaluate(blackboard.get_state())
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
