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
  Eye,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  Sparkles,
  Download
} from 'lucide-react';
import {
  StructuredGoal,
  BlackboardSnapshot,
  FinalEvaluationResult,
  StructuredSubTask,
  WorkerResult,
  IntermediateReviewResult,
  NegativeKnowledgeItem
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
        return <Calculator className="w-4 h-4 text-amber-400" />;
      case 'code':
        return <Code2 className="w-4 h-4 text-emerald-400" />;
      case 'vision':
        return <ImageIcon className="w-4 h-4 text-cyan-400" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-400" />;
      default:
        return <FileCheck className="w-4 h-4 text-blue-400" />;
    }
  };

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status Header */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            {isExecuting ? (
              <Zap className="w-5 h-5 animate-pulse text-cyan-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Current Stage: {currentStage}
              </span>
              {isExecuting && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-200">{stageMessage}</p>
          </div>
        </div>

        {/* Jev System 1 Telemetry Pill */}
        {structuredGoal && (
          <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block">Jev Routing Latency</span>
              <span className="text-emerald-400 font-bold">{structuredGoal.jev_routing_latency_ms} ms</span>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-500 block">System 1 Confidence</span>
              <span className="text-cyan-400 font-bold">{(structuredGoal.jev_confidence * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'timeline'
              ? 'bg-slate-800 text-cyan-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Execution DAG & Reviews
        </button>

        <button
          onClick={() => setActiveTab('blackboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'blackboard'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Common Context Blackboard
          {blackboard?.negative_knowledge.length ? (
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono">
              {blackboard.negative_knowledge.length} Mitigations
            </span>
          ) : null}
        </button>

        {finalEvaluation && (
          <button
            onClick={() => setActiveTab('deliverables')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeTab === 'deliverables'
                ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Final Deliverables & Score ({finalEvaluation.overall_completion_score}%)
          </button>
        )}
      </div>

      {/* TAB 1: EXECUTION DAG & REVIEWS */}
      {activeTab === 'timeline' && structuredGoal && (
        <div className="space-y-4">
          {structuredGoal.sub_tasks.map((task, idx) => {
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
                    ? 'bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : isCompleted
                    ? 'bg-slate-900/70 border-slate-800'
                    : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                }`}
              >
                {/* Step Header */}
                <div
                  onClick={() => toggleStep(task.step_id)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                      {getDomainIcon(task.domain)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {task.step_id.toUpperCase()} &bull; {task.domain}
                        </span>
                        <h4 className="text-sm font-bold text-white">{task.title}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                        <span>Worker: <strong className="text-slate-200">{task.assigned_worker_model.split(' ')[0]}</strong></span>
                        <span>&bull;</span>
                        <span>QA: <strong className="text-slate-200">{task.assigned_reviewer_model.split(' ')[0]}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                        <Clock className="w-3.5 h-3.5 animate-spin" /> In Progress
                      </span>
                    ) : isCompleted ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-400 font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          QA {review?.quality_score}% Passed
                        </span>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">Pending</span>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {task.description}
                    </p>

                    {/* Worker Output */}
                    {output && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-mono text-cyan-400 font-semibold">Specialized Worker Output:</span>
                          <span className="font-mono">{output.execution_time_ms} ms</span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                          {output.output_text}
                        </div>
                      </div>
                    )}

                    {/* Intermediate Review Inspection Card */}
                    {review && (
                      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                              Intermediate Review Gate: {review.reviewer_model}
                            </span>
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
                            Quality Score: {review.quality_score}/100
                          </span>
                        </div>
                        <p className="text-xs text-emerald-200/90 whitespace-pre-wrap font-mono">
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
        <div className="space-y-6">
          {/* Prerequisites */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              Global Prerequisites & Ingested Assets
            </h4>
            <div className="space-y-1.5 font-mono text-xs text-slate-300">
              {blackboard.global_prerequisites.map((p, i) => (
                <div key={i} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Negative Knowledge & Error Avoidance Registry */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Negative Knowledge & Error Avoidance Registry ({blackboard.negative_knowledge.length} Logged)
              </h4>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Shared Memory Shield
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Any edge cases, potential drifts, or reviewer warnings are committed here so downstream agents explicitly avoid them:
            </p>

            <div className="space-y-3">
              {blackboard.negative_knowledge.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                      [{item.stage}] {item.issue_type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Origin: {item.step_id}</span>
                  </div>
                  <p className="text-xs text-slate-300"><strong>Observed:</strong> {item.description}</p>
                  <p className="text-xs text-emerald-400 font-mono"><strong>Mitigation:</strong> {item.mitigation_applied}</p>
                  <p className="text-xs text-cyan-300 font-mono">
                    <strong>Avoidance Rule for Downstream:</strong> {item.prevention_directive_for_downstream}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cumulative Outputs Ledger */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Cumulative Verified Outputs Ledger
            </h4>
            <div className="space-y-3 font-mono text-xs">
              {Object.entries(blackboard.completed_outputs).map(([stepId, res]) => (
                <div key={stepId} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-bold text-emerald-400">{stepId.toUpperCase()} ({res.domain})</span>
                    <span>Model: {res.worker_model}</span>
                  </div>
                  <p className="text-slate-300 line-clamp-2">{res.output_text.slice(0, 180)}...</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DELIVERABLES & FINAL SCORE */}
      {activeTab === 'deliverables' && finalEvaluation && (
        <div className="space-y-6">
          {/* Completion Gauge Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase font-mono">
                <Sparkles className="w-3.5 h-3.5" /> Final Review Benchmark
              </div>
              <h3 className="text-2xl font-black text-white">Execution Objective Fulfilled</h3>
              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                {finalEvaluation.summary_for_user}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/80 border border-indigo-500/30 min-w-[180px]">
              <span className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                {finalEvaluation.overall_completion_score}%
              </span>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 mt-1">
                Completion Score
              </span>
            </div>
          </div>

          {/* Compliance Breakdown */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white">Quality Gate Breakdown</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(finalEvaluation.compliance_breakdown).map(([metric, score]) => (
                <div key={metric} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{metric}</span>
                    <span className="font-mono font-bold text-emerald-400">{score}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full"
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deliverables Explorer */}
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white">Generated Deliverables & Assets</h4>
            <div className="space-y-4">
              {Object.entries(finalEvaluation.deliverables).map(([id, del]) => (
                <div key={id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDomainIcon(del.domain)}
                      <h5 className="text-sm font-bold text-white capitalize">{del.title}</h5>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      {del.domain}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900/90 font-mono text-xs text-slate-200 max-h-52 overflow-y-auto whitespace-pre-wrap border border-slate-800/60">
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
