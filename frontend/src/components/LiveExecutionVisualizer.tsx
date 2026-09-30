import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Code2,
  Calculator,
  Image as ImageIcon,
  Video,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import {
  StructuredGoal,
  BlackboardSnapshot,
  FinalEvaluationResult,
  StructuredSubTask,
} from '../types';

interface LiveExecutionVisualizerProps {
  currentStage: string;
  stageMessage: string;
  structuredGoal: StructuredGoal | null;
  blackboard: BlackboardSnapshot | null;
  activeSubtask: StructuredSubTask | null;
  finalEvaluation: FinalEvaluationResult | null;
  isExecuting: boolean;
}

export const LiveExecutionVisualizer: React.FC<LiveExecutionVisualizerProps> = ({
  currentStage,
  stageMessage,
  structuredGoal,
  blackboard,
  activeSubtask,
  finalEvaluation,
  isExecuting
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'blackboard' | 'deliverables'>('timeline');
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const getDomainIcon = (domain: string) => {
    switch (domain.toLowerCase()) {
      case 'math':
        return <Calculator className="w-3.5 h-3.5 text-neutral-300" />;
      case 'code':
        return <Code2 className="w-3.5 h-3.5 text-neutral-300" />;
      case 'vision':
        return <ImageIcon className="w-3.5 h-3.5 text-neutral-300" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-neutral-300" />;
      default:
        return <FileCheck className="w-3.5 h-3.5 text-neutral-300" />;
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="p-4 rounded-2xl bg-[#080808] border border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white">
            {isExecuting ? (
              <Zap className="w-4 h-4 text-white animate-pulse" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Phase: {currentStage}
              </span>
              {isExecuting && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </div>
            <p className="text-xs font-medium text-white">{stageMessage}</p>
          </div>
        </div>

        {/* Jev System 1 Telemetry (Monochrome minimal pill) */}
        {structuredGoal && (
          <div className="flex items-center gap-4 bg-[#030303] px-3.5 py-1.5 rounded-xl border border-white/[0.06] text-xs font-mono">
            <div>
              <span className="text-neutral-500 text-[10px] block">Jev Routing</span>
              <span className="text-white font-medium">{structuredGoal.jev_routing_latency_ms} ms</span>
            </div>
            <div className="h-5 w-px bg-white/[0.08]"></div>
            <div>
              <span className="text-neutral-500 text-[10px] block">Confidence</span>
              <span className="text-neutral-300 font-medium">{(structuredGoal.jev_confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'timeline'
              ? 'bg-white/[0.06] text-white border border-white/[0.1]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Execution DAG & Reviews</span>
        </button>

        <button
          onClick={() => setActiveTab('blackboard')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'blackboard'
              ? 'bg-white/[0.06] text-white border border-white/[0.1]'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Common Context Blackboard</span>
          {blackboard?.negative_knowledge.length ? (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08] text-neutral-300 font-mono">
              {blackboard.negative_knowledge.length}
            </span>
          ) : null}
        </button>

        {finalEvaluation && (
          <button
            onClick={() => setActiveTab('deliverables')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'deliverables'
                ? 'bg-white/[0.06] text-white border border-white/[0.1]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
            <span>Deliverables ({finalEvaluation.overall_completion_score}%)</span>
          </button>
        )}
      </div>

      {/* TAB 1: EXECUTION DAG & REVIEWS */}
      {activeTab === 'timeline' && structuredGoal && (
        <div className="space-y-3">
          {structuredGoal.sub_tasks.map((task) => {
            const output = blackboard?.completed_outputs[task.step_id];
            const review = blackboard?.intermediate_reviews[task.step_id];
            const isActive = activeSubtask?.step_id === task.step_id;
            const isCompleted = !!output && !!review;
            const isExpanded = expandedStep === task.step_id || isActive;

            return (
              <div
                key={task.step_id}
                className={`rounded-2xl border transition-all overflow-hidden ${
                  isActive
                    ? 'bg-[#0a0a0a] border-white/30 shadow-lg'
                    : isCompleted
                    ? 'bg-[#080808] border-white/[0.08]'
                    : 'bg-[#040404] border-white/[0.04] opacity-50'
                }`}
              >
                {/* Step Header */}
                <div
                  onClick={() => toggleStep(task.step_id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                      {getDomainIcon(task.domain)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.2 rounded bg-white/[0.04] text-neutral-400 border border-white/[0.06]">
                          {task.step_id.toUpperCase()} &bull; {task.domain}
                        </span>
                        <h4 className="text-xs font-medium text-white">{task.title}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-1 font-mono">
                        <span>Worker: <strong className="text-neutral-300">{task.assigned_worker_model.split(' ')[0]}</strong></span>
                        <span>&bull;</span>
                        <span>Reviewer: <strong className="text-neutral-300">Gemini 2.0 Flash</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <span className="flex items-center gap-1.5 text-[11px] text-neutral-300 font-mono px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.1]">
                        <Clock className="w-3 h-3 animate-spin" /> In Progress
                      </span>
                    ) : isCompleted ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/[0.08] border border-emerald-500/20">
                          Gemini QA {review?.quality_score}%
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-600 font-mono">Pending</span>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-white/[0.06] space-y-3.5">
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {task.description}
                    </p>

                    {/* Worker Output */}
                    {output && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                          <span>Output ({output.worker_model})</span>
                          <span>{output.execution_time_ms} ms</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-[#030303] border border-white/[0.06] font-mono text-xs text-neutral-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                          {output.output_text}
                        </div>
                      </div>
                    )}

                    {/* Dedicated Gemini Review Inspection Card */}
                    {review && (
                      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-emerald-500/30 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] font-mono font-medium text-emerald-400 uppercase tracking-wider">
                              Dedicated Reviewer Gate: {review.reviewer_model}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Score: {review.quality_score}/100
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 font-mono whitespace-pre-wrap">
                          {review.critique}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: COMMON CONTEXT BLACKBOARD */}
      {activeTab === 'blackboard' && blackboard && (
        <div className="space-y-5">
          {/* Prerequisites */}
          <div className="p-5 rounded-2xl bg-[#080808] border border-white/[0.08] space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
              Global Prerequisites & Ingested Assets
            </h4>
            <div className="space-y-1.5 font-mono text-xs text-neutral-300">
              {blackboard.global_prerequisites.map((p, i) => (
                <div key={i} className="p-2 rounded-lg bg-[#030303] border border-white/[0.06]">
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Negative Knowledge & Avoidance Registry */}
          <div className="p-5 rounded-2xl bg-[#080808] border border-white/[0.12] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Negative Knowledge & Avoidance Registry ({blackboard.negative_knowledge.length} Logged)
              </h4>
              <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
                Continuity Shield
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Reviewer critiques and edge cases captured here to prevent downstream agents from repeating past mistakes:
            </p>

            <div className="space-y-2.5">
              {blackboard.negative_knowledge.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#030303] border border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-medium text-white uppercase">
                      [{item.stage}] {item.issue_type}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">Origin: {item.step_id}</span>
                  </div>
                  <p className="text-xs text-neutral-400"><strong>Observed:</strong> {item.description}</p>
                  <p className="text-xs text-neutral-300 font-mono">
                    <strong>Avoidance Rule:</strong> {item.prevention_directive_for_downstream}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cumulative Outputs Ledger */}
          <div className="p-5 rounded-2xl bg-[#080808] border border-white/[0.08] space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Cumulative Verified Outputs Ledger
            </h4>
            <div className="space-y-2.5 font-mono text-xs">
              {Object.entries(blackboard.completed_outputs).map(([stepId, res]) => (
                <div key={stepId} className="p-3 rounded-xl bg-[#030303] border border-white/[0.06] space-y-1">
                  <div className="flex items-center justify-between text-neutral-500 text-[11px]">
                    <span className="font-semibold text-white">{stepId.toUpperCase()} ({res.domain})</span>
                    <span>{res.worker_model}</span>
                  </div>
                  <p className="text-neutral-400 line-clamp-2">{res.output_text.slice(0, 160)}...</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DELIVERABLES & FINAL SCORE */}
      {activeTab === 'deliverables' && finalEvaluation && (
        <div className="space-y-5">
          {/* Completion Score Card */}
          <div className="p-6 rounded-2xl bg-[#080808] border border-white/[0.12] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[11px] text-neutral-400 font-mono">
                <Sparkles className="w-3 h-3 text-neutral-400" />
                <span>Verification Complete</span>
              </div>
              <h3 className="text-2xl font-medium text-white tracking-tight">Objective Successfully Executed</h3>
              <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
                {finalEvaluation.summary_for_user}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#030303] border border-white/[0.1] min-w-[160px]">
              <span className="text-4xl font-light text-white tracking-tight">
                {finalEvaluation.overall_completion_score}%
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mt-1">
                Completion Score
              </span>
            </div>
          </div>

          {/* Compliance Breakdown */}
          <div className="p-5 rounded-2xl bg-[#080808] border border-white/[0.08] space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Quality Metric Breakdown</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(finalEvaluation.compliance_breakdown).map(([metric, score]) => (
                <div key={metric} className="p-3 rounded-xl bg-[#030303] border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">{metric}</span>
                    <span className="font-mono text-white">{score}%</span>
                  </div>
                  <div className="w-full bg-white/[0.06] h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full"
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables Explorer */}
          <div className="p-5 rounded-2xl bg-[#080808] border border-white/[0.08] space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Generated Deliverables & Assets</h4>
            <div className="space-y-3">
              {Object.entries(finalEvaluation.deliverables).map(([id, del]) => (
                <div key={id} className="p-4 rounded-xl bg-[#030303] border border-white/[0.06] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDomainIcon(del.domain)}
                      <h5 className="text-xs font-medium text-white capitalize">{del.title}</h5>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-neutral-400 uppercase">
                      {del.domain}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#000000] font-mono text-xs text-neutral-300 max-h-48 overflow-y-auto whitespace-pre-wrap border border-white/[0.06]">
                    {del.summary}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
