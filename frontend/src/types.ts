export interface IngestedFile {
  filename: string;
  content_type: string;
  size_bytes: number;
  preview_or_content: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface StructuredSubTask {
  step_id: string;
  title: string;
  domain: string;
  description: string;
  assigned_worker_model: string;
  assigned_reviewer_model: string;
  required_prerequisites: string[];
  expected_output_type: string;
  status: TaskStatus;
}

export interface StructuredGoal {
  primary_objective: string;
  prerequisites: string[];
  constraints: string[];
  sub_tasks: StructuredSubTask[];
  jev_routing_latency_ms: number;
  jev_confidence: number;
}

export interface WorkerResult {
  step_id: string;
  worker_model: string;
  domain: string;
  output_text: string;
  user_deliverable?: string;
  internal_handover?: Record<string, any>;
  artifacts: Record<string, any>;
  execution_time_ms: number;
  success: boolean;
}

export interface IntermediateReviewResult {
  step_id: string;
  reviewer_model: string;
  status: 'approved' | 'rejected' | 'warning';
  quality_score: number;
  critique: string;
  recommendations: string[];
  passed: boolean;
  mitigation_required: boolean;
}

export interface NegativeKnowledgeItem {
  step_id: string;
  stage: string;
  issue_type: string;
  description: string;
  mitigation_applied: string;
  prevention_directive_for_downstream: string;
}

export interface FinalEvaluationResult {
  overall_completion_score: number;
  compliance_breakdown: Record<string, number>;
  internal_audit_notes: string[];
  summary_for_user: string;
  deliverables: Record<string, any>;
}

export interface BlackboardSnapshot {
  session_id: string;
  original_prompt: string;
  structured_goal?: StructuredGoal;
  global_prerequisites: string[];
  completed_outputs: Record<string, WorkerResult>;
  intermediate_reviews: Record<string, IntermediateReviewResult>;
  negative_knowledge: NegativeKnowledgeItem[];
  inter_agent_handovers?: Record<string, Record<string, any>>;
  current_step_id?: string;
  audit_trail: Array<{
    timestamp: number;
    event_type: string;
    message: string;
  }>;
}

export interface ToolRecommendation {
  category: string;
  tool_name: string;
  provider: string;
  description: string;
  why_recommended: string;
  sample_prompt: string;
  is_free: boolean;
  pricing_tier: string;
}

export interface AdvisorResponse {
  original_query: string;
  task_decomposition: string[];
  recommendations: ToolRecommendation[];
  diy_execution_blueprint: Array<{
    step: number;
    action: string;
    recommended_tool: string;
    instruction?: string;
    input?: string;
    expected_output?: string;
  }>;
}

export interface PlanClarifyingQuestion {
  id: string;
  question: string;
  options: string[];
  default_selected?: string;
  allow_custom?: boolean;
}

export interface ImplementationStepPlan {
  step_number: number;
  title: string;
  domain: string;
  assigned_worker: string;
  description: string;
  expected_output: string;
}

export interface InteractivePlanResponse {
  objective_summary: string;
  architectural_approach: string;
  assumptions: string[];
  steps: ImplementationStepPlan[];
  clarifying_questions: PlanClarifyingQuestion[];
  suggested_focus?: string;
}
