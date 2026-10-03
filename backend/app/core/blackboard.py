import time
from typing import Dict, Any, List, Optional
from app.models.schemas import (
    BlackboardState,
    StructuredGoal,
    WorkerResult,
    IntermediateReviewResult,
    NegativeKnowledgeItem,
    IngestedFile,
)

class CommonContextBlackboard:
    """
    Common Context Window & Shared Blackboard Memory.
    Acts as the centralized single source of truth across all sub-agents.
    Eliminates context amnesia, hallucination, and repeated mistakes.
    """
    def __init__(self, session_id: str, original_prompt: str):
        self.session_id = session_id
        self.original_prompt = original_prompt
        self.structured_goal: Optional[StructuredGoal] = None
        self.global_prerequisites: List[str] = []
        self.ingested_files: List[IngestedFile] = []
        self.completed_outputs: Dict[str, WorkerResult] = {}
        self.intermediate_reviews: Dict[str, IntermediateReviewResult] = {}
        self.negative_knowledge: List[NegativeKnowledgeItem] = []
        self.current_step_id: Optional[str] = None
        self.audit_trail: List[Dict[str, Any]] = []
        self._log_audit("INITIALIZE", f"Blackboard created for session {session_id}")

    def _log_audit(self, event_type: str, message: str, metadata: Optional[Dict[str, Any]] = None):
        self.audit_trail.append({
            "timestamp": time.time(),
            "event_type": event_type,
            "message": message,
            "metadata": metadata or {}
        })

    def set_structured_goal(self, goal: StructuredGoal, files: List[IngestedFile]):
        self.structured_goal = goal
        self.ingested_files = files
        self.global_prerequisites = list(goal.prerequisites)
        if files:
            for f in files:
                self.global_prerequisites.append(f"Ingested file: {f.filename} ({f.size_bytes} bytes)")
        self._log_audit("STRUCTURED_GOAL_SET", f"Structured goal with {len(goal.sub_tasks)} tasks initialized")

    def get_context_for_subagent(self, step_id: str) -> Dict[str, Any]:
        """
        Supplies the sub-agent with everything it needs before starting:
        - Baseline objective and constraints
        - Global prerequisites & ingested file references
        - Previous step outputs (cumulative knowledge)
        - NEGATIVE KNOWLEDGE: warnings, past errors, and avoidance directives
        """
        target_subtask = None
        if self.structured_goal:
            for st in self.structured_goal.sub_tasks:
                if st.step_id == step_id:
                    target_subtask = st
                    break

        # Compile previous verified outputs
        prior_knowledge = {}
        for prev_step_id, worker_res in self.completed_outputs.items():
            review = self.intermediate_reviews.get(prev_step_id)
            prior_knowledge[prev_step_id] = {
                "domain": worker_res.domain,
                "summary": worker_res.output_text[:300] + ("..." if len(worker_res.output_text) > 300 else ""),
                "full_output": worker_res.output_text,
                "artifacts": worker_res.artifacts,
                "review_score": review.quality_score if review else 100,
                "review_critique": review.critique if review else "Approved without remarks"
            }

        # Curate negative knowledge directives
        avoidance_rules = [
            f"[{item.stage.upper()}] Note: {item.description} -> Directive: {item.prevention_directive_for_downstream}"
            for item in self.negative_knowledge
        ]

        context_packet = {
            "session_id": self.session_id,
            "primary_objective": self.structured_goal.primary_objective if self.structured_goal else self.original_prompt,
            "constraints": self.structured_goal.constraints if self.structured_goal else [],
            "global_prerequisites": self.global_prerequisites,
            "current_step": target_subtask.model_dump() if target_subtask else {"step_id": step_id},
            "cumulative_prior_outputs": prior_knowledge,
            "negative_knowledge_avoidance_rules": avoidance_rules,
            "ingested_files": [
                {
                    "filename": f.filename,
                    "size": f.size_bytes,
                    "content_type": f.content_type,
                    "content": f.preview_or_content
                }
                for f in self.ingested_files
            ]
        }
        
        self._log_audit("CONTEXT_FETCHED", f"Context prepared for sub-agent step {step_id}")
        return context_packet

    def record_worker_output(self, step_id: str, result: WorkerResult):
        self.completed_outputs[step_id] = result
        self._log_audit("WORKER_OUTPUT_RECORDED", f"Step {step_id} output saved", {
            "worker_model": result.worker_model,
            "domain": result.domain,
            "execution_time_ms": result.execution_time_ms
        })

    def record_intermediate_review(self, step_id: str, review: IntermediateReviewResult):
        self.intermediate_reviews[step_id] = review
        self._log_audit("INTERMEDIATE_REVIEW_RECORDED", f"Step {step_id} reviewed with score {review.quality_score}", {
            "passed": review.passed,
            "status": review.status,
            "reviewer_model": review.reviewer_model
        })

    def append_negative_knowledge(self, item: NegativeKnowledgeItem):
        """
        Logs errors, edge cases, or review rejections to shared memory.
        Guarantees downstream agents receive active guidance to avoid repeating it.
        """
        self.negative_knowledge.append(item)
        self._log_audit("NEGATIVE_KNOWLEDGE_APPENDED", f"Logged issue in {item.stage}: {item.description}", {
            "mitigation": item.mitigation_applied,
            "directive": item.prevention_directive_for_downstream
        })

    def get_state(self) -> BlackboardState:
        return BlackboardState(
            session_id=self.session_id,
            original_prompt=self.original_prompt,
            structured_goal=self.structured_goal,
            global_prerequisites=self.global_prerequisites,
            completed_outputs=self.completed_outputs,
            intermediate_reviews=self.intermediate_reviews,
            negative_knowledge=self.negative_knowledge,
            current_step_id=self.current_step_id,
            audit_trail=self.audit_trail
        )
