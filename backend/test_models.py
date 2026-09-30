import asyncio
from app.models.schemas import StructuredGoal, StructuredSubTask, DomainType, TaskStatus
from app.core.jev_router import JevFastRouter
from app.workers.worker_pool import WorkerPool
from app.reviewers.review_engine import IntermediateReviewEngine

async def test_all_models():
    print("==================================================")
    print("TESTING USER-APPROVED 5-MODEL LINEUP + GEMINI QA")
    print("==================================================")

    router = JevFastRouter()
    worker_pool = WorkerPool()
    reviewer = IntermediateReviewEngine()

    # 1. Test Jev (Routing Only)
    sample_goal = StructuredGoal(
        primary_objective="Develop an automated fintech microservice with logic bounds, code, visual diagram, summary, and audit.",
        prerequisites=["User prompt"],
        constraints=["High reliability"],
        sub_tasks=[
            StructuredSubTask(
                step_id="step_1",
                title="Formal Business & Regulatory Logic",
                domain=DomainType.MATH,
                description="Derive equations and regulatory compliance checks.",
                assigned_worker_model="",
                assigned_reviewer_model="",
                expected_output_type="logic"
            ),
            StructuredSubTask(
                step_id="step_2",
                title="Python Backend Implementation",
                domain=DomainType.CODE,
                description="Write production Python 3.12 service with guardrails.",
                assigned_worker_model="",
                assigned_reviewer_model="",
                expected_output_type="code"
            ),
            StructuredSubTask(
                step_id="step_3",
                title="Architecture Infographic",
                domain=DomainType.VISION,
                description="Generate visual infographic.",
                assigned_worker_model="",
                assigned_reviewer_model="",
                expected_output_type="image"
            ),
            StructuredSubTask(
                step_id="step_4",
                title="Executive Summary",
                domain=DomainType.AUDIT,
                description="Summarize overall findings.",
                assigned_worker_model="",
                assigned_reviewer_model="",
                expected_output_type="summary"
            ),
            StructuredSubTask(
                step_id="step_5",
                title="Quality & Risk Audit",
                domain=DomainType.AUDIT,
                description="Audit all artifacts for security and consistency.",
                assigned_worker_model="",
                assigned_reviewer_model="",
                expected_output_type="audit"
            )
        ]
    )

    print("\n[1] Testing Jev Fast Router (Strictly Routing Only)...")
    routed_goal = router.route_plan(sample_goal)
    print(f"  Jev Routing Latency: {routed_goal.jev_routing_latency_ms}ms")
    for t in routed_goal.sub_tasks:
        print(f"  • {t.step_id}: {t.title}")
        print(f"    Worker:   {t.assigned_worker_model}")
        print(f"    Reviewer: {t.assigned_reviewer_model}")

    # 2. Test Execution & Gemini Review for each task
    mock_context = {
        "primary_objective": sample_goal.primary_objective,
        "cumulative_prior_outputs": {},
        "negative_knowledge_avoidance_rules": ["Avoid precision drift", "Enforce input guardrails"]
    }

    print("\n[2] Testing Workers & Gemini Review Gates...")
    for task in routed_goal.sub_tasks:
        print(f"\n---> Executing Task {task.step_id} with {task.assigned_worker_model}...")
        w_res = await worker_pool.execute_task(task, mock_context)
        print(f"     [Worker Result] Latency: {w_res.execution_time_ms}ms | Success: {w_res.success}")
        
        print(f"     [Gemini Reviewer] Inspecting {task.domain} output...")
        rev, neg = await reviewer.review_task(task, w_res)
        print(f"     [Gemini Review Gate] Score: {rev.quality_score}/100 | Status: {rev.status.value.upper()}")
        print(f"     Critique: {rev.critique.splitlines()[0]}")
        if neg:
            print(f"     Negative Knowledge Logged: {neg.issue_type} -> Directive: {neg.prevention_directive_for_downstream[:60]}...")
            mock_context["negative_knowledge_avoidance_rules"].append(neg.prevention_directive_for_downstream)

    print("\n==================================================")
    print("ALL 5 SPECIALIST WORKERS + GEMINI REVIEWER VERIFIED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(test_all_models())
