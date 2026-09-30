import asyncio
import json
from app.models.schemas import TaskRequest, IngestedFile
from app.orchestrator import OmniOrchestrator

async def run_test():
    print("==================================================")
    print("STARTING OMNI AGENT END-TO-END PIPELINE TEST")
    print("==================================================")

    orchestrator = OmniOrchestrator()
    sample_request = TaskRequest(
        prompt="Analyze sales revenue growth, calculate the optimal scaling coefficient, implement the production Python engine with guardrails, synthesize a 16:9 infographic diagram, and provide a full executive audit.",
        files=[
            IngestedFile(
                filename="q3_financial_metrics.csv",
                content_type="text/csv",
                size_bytes=4820,
                preview_or_content="month,revenue,costs\nJuly,120000,85000\nAugust,145000,92000\nSeptember,198000,105000"
            )
        ]
    )

    async for event_raw in orchestrator.execute_stream(sample_request):
        lines = event_raw.strip().split("\n")
        for line in lines:
            if line.startswith("data: "):
                payload = json.loads(line[6:])
                event_name = payload["event"]
                event_data = payload["data"]

                if event_name == "STAGE_CHANGE":
                    print(f"\n[PHASE] >>> {event_data['stage']}: {event_data['message']}")
                elif event_name == "STRUCTURING_COMPLETED":
                    goal = event_data["structured_goal"]
                    print(f"  [Structurer] Objective: {goal['primary_objective'][:60]}...")
                    print(f"  [Structurer] Sub-tasks identified: {len(goal['sub_tasks'])}")
                elif event_name == "JEV_ROUTING_COMPLETED":
                    print(f"  [Jev Router] System 1 classification complete in {event_data['latency_ms']}ms (Confidence: {event_data['confidence']*100:.1f}%)")
                    for st in event_data["routed_plan"]["sub_tasks"]:
                        print(f"    - Subtask: {st['title']} -> Model: {st['assigned_worker_model']} (QA: {st['assigned_reviewer_model']})")
                elif event_name == "SUBAGENT_STARTED":
                    print(f"\n  [Sub-Agent Running] {event_data['step_id']} ({event_data['domain'].upper()}): {event_data['title']}")
                elif event_name == "CONTEXT_INJECTED":
                    print(f"    [Common Context Blackboard] Injected {event_data['prior_outputs_count']} prior step outputs & {len(event_data['avoidance_rules'])} avoidance rules")
                elif event_name == "WORKER_COMPLETED":
                    w = event_data["worker_result"]
                    print(f"    [Worker Completed] Latency: {w['execution_time_ms']}ms | Success: {w['success']}")
                elif event_name == "INTERMEDIATE_REVIEW_COMPLETED":
                    r = event_data["review_result"]
                    nk = event_data["negative_knowledge_logged"]
                    print(f"    [Intermediate Review Gate] Score: {r['quality_score']}/100 | Status: {r['status'].upper()}")
                    if nk:
                        print(f"    [Negative Knowledge Logged] {nk['issue_type']}: {nk['prevention_directive_for_downstream'][:75]}...")
                elif event_name == "EXECUTION_COMPLETED":
                    ev = event_data["final_evaluation"]
                    print(f"\n==================================================")
                    print(f"FINAL COMPLETION SCORE: {ev['overall_completion_score']}%")
                    print(f"Breakdown: {ev['compliance_breakdown']}")
                    print(f"Summary: {ev['summary_for_user']}")
                    print(f"Deliverables Generated: {list(ev['deliverables'].keys())}")
                    print(f"==================================================")

if __name__ == "__main__":
    asyncio.run(run_test())
