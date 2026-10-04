import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Copy,
  Check,
  Zap,
  CheckCircle2,
  Clock,
  RotateCcw,
  Paperclip,
  Cpu,
  Layers,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';
import {
  IngestedFile,
  StructuredGoal,
  BlackboardSnapshot,
  StructuredSubTask,
  FinalEvaluationResult,
  TaskStatus
} from '../types';
import { LiveExecutionVisualizer } from './LiveExecutionVisualizer';

interface WorkerWorkspaceProps {
  prompt: string;
  files: IngestedFile[];
  askBeforeDoing: boolean;
  clarifications?: Record<string, string>;
  approvedPlanSummary?: string;
  onBack: () => void;
  onRunAgain: (newPrompt: string) => void;
}

export const WorkerWorkspace: React.FC<WorkerWorkspaceProps> = ({
  prompt,
  files,
  askBeforeDoing,
  clarifications,
  approvedPlanSummary,
  onBack,
  onRunAgain
}) => {
  const [isExecuting, setIsExecuting] = useState<boolean>(true);
  const [currentStage, setCurrentStage] = useState<string>('STARTING');
  const [stageMessage, setStageMessage] = useState<string>('Initializing OmniTask AI execution pipeline...');
  const [structuredGoal, setStructuredGoal] = useState<StructuredGoal | null>(null);
  const [blackboard, setBlackboard] = useState<BlackboardSnapshot | null>(null);
  const [activeSubtask, setActiveSubtask] = useState<StructuredSubTask | null>(null);
  const [finalEvaluation, setFinalEvaluation] = useState<FinalEvaluationResult | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  // Accurate progress calculation
  const calculateProgress = (): number => {
    if (finalEvaluation || currentStage === 'COMPLETED') return 100;
    if (currentStage === 'STARTING') return 8;
    if (currentStage === 'STRUCTURING') return 20;
    if (currentStage === 'JEV_ROUTING') return 35;

    const totalSteps = structuredGoal?.sub_tasks?.length || 3;
    const completedCount = blackboard ? Object.keys(blackboard.completed_outputs || {}).length : 0;

    if (currentStage === 'EXECUTING' || activeSubtask) {
      const stepPortion = (completedCount / totalSteps) * 50;
      return Math.min(92, Math.round(40 + stepPortion));
    }

    if (currentStage === 'FINAL_EVALUATION') return 94;
    return 15;
  };

  const progressPercent = calculateProgress();

  useEffect(() => {
    let isCancelled = false;

    const runExecution = async () => {
      setIsExecuting(true);
      setCurrentStage('STARTING');
      setStageMessage('Initializing OmniTask AI multi-agent swarm...');

      try {
        const response = await fetch('/api/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: prompt,
            files: files,
            mode: 'paid',
            allow_simulation: true,
            ask_before_doing: askBeforeDoing,
            user_clarifications: clarifications,
            approved_plan_summary: approvedPlanSummary
          })
        });

        if (!response.body) throw new Error('ReadableStream not supported');

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (!isCancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              try {
                const payload = JSON.parse(jsonStr);
                handleSSEEvent(payload.event, payload.data);
              } catch (e) {
                console.error('Failed to parse SSE payload', e);
              }
            }
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Execution error:', err);
          setCurrentStage('ERROR');
          setStageMessage('Encountered an issue during execution.');
        }
      } finally {
        if (!isCancelled) {
          setIsExecuting(false);
        }
      }
    };

    runExecution();

    return () => {
      isCancelled = true;
    };
  }, [prompt, files, askBeforeDoing, clarifications, approvedPlanSummary]);

  const handleSSEEvent = (eventName: string, data: any) => {
    if (eventName === 'STAGE_CHANGE') {
      setCurrentStage(data.stage);
      setStageMessage(data.message);
    } else if (eventName === 'STRUCTURING_COMPLETED') {
      setStructuredGoal(data.structured_goal);
    } else if (eventName === 'JEV_ROUTING_COMPLETED') {
      setStructuredGoal(data.routed_plan);
    } else if (eventName === 'BLACKBOARD_INITIALIZED') {
      setBlackboard({
        session_id: data.session_id,
        original_prompt: prompt,
        global_prerequisites: data.prerequisites,
        completed_outputs: {},
        intermediate_reviews: {},
        negative_knowledge: [],
        audit_trail: []
      });
    } else if (eventName === 'SUBAGENT_STARTED') {
      setActiveSubtask(data);
      setCurrentStage('EXECUTING');
      setStageMessage(`Worker: ${data.assigned_worker || 'Specialist'} executing '${data.title}'...`);
    } else if (eventName === 'STEP_RETRY_INITIATED') {
      setCurrentStage('EXECUTING');
      setStageMessage(`Auto-Correction: ${data.rejection_critique || 'Refining deliverable'}...`);
    } else if (eventName === 'INTERMEDIATE_REVIEW_COMPLETED') {
      if (data.blackboard_snapshot) {
        setBlackboard(data.blackboard_snapshot);
      }
    } else if (eventName === 'EXECUTION_COMPLETED') {
      setCurrentStage('COMPLETED');
      setStageMessage(`Task execution finalized • Score: ${data.final_evaluation.overall_completion_score}%`);
      setFinalEvaluation(data.final_evaluation);
      if (data.full_blackboard_state) {
        setBlackboard(data.full_blackboard_state);
      }
      setActiveSubtask(null);
    }
  };

  const copyPromptText = () => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-[#ededed] flex flex-col font-['Inter',sans-serif] selection:bg-white/20 selection:text-white">
      {/* Top Ambient Lighting */}
      <div className="fixed top-0 left-0 right-0 h-96 resend-radial-glow pointer-events-none z-0"></div>
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-3/4 h-px resend-top-line pointer-events-none z-0"></div>

      {/* TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-black/85 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-xs font-medium text-neutral-300 hover:text-white border border-white/[0.08] transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Inputs</span>
          </button>

          <div className="h-5 w-px bg-white/[0.1] hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <img src="/omnitask-logo.png" alt="OmniTask AI" className="h-5 w-auto object-contain" />
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Track 2 &bull; Autonomous Swarm Workspace
            </span>
          </div>
        </div>

        {/* Jev System 1 Telemetry & Score */}
        <div className="flex items-center gap-3">
          {structuredGoal && (
            <div className="hidden md:flex items-center gap-3 bg-[#080808] px-3 py-1.5 rounded-xl border border-white/[0.08] text-xs font-mono">
              <span className="text-neutral-500 text-[10px]">JEV ROUTING:</span>
              <span className="text-emerald-400 font-semibold">{structuredGoal.jev_routing_latency_ms} ms</span>
              <span className="text-neutral-600">&bull;</span>
              <span className="text-neutral-300">{(structuredGoal.jev_confidence * 100).toFixed(1)}% Conf</span>
            </div>
          )}

          {finalEvaluation && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Score: {finalEvaluation.overall_completion_score}%</span>
            </div>
          )}
        </div>
      </header>

      {/* MAIN CONTENT AREA: Expansive Wide Canvas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8 relative z-10">

        {/* =========================================================================
            SECTION 1: USER'S SUBMITTED PROMPT & ATTACHED ASSETS (Clear & Big)
           ========================================================================= */}
        <div className="bg-[#080808] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                Your Submitted Objective
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyPromptText}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-[11px] font-mono text-neutral-400 hover:text-white border border-white/[0.06] transition-all"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>

              <button
                onClick={onBack}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-[11px] font-mono text-neutral-400 hover:text-white border border-white/[0.06] transition-all"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Edit / New</span>
              </button>
            </div>
          </div>

          <p className="text-base sm:text-lg font-normal text-white leading-relaxed font-sans mb-4">
            &ldquo;{prompt}&rdquo;
          </p>

          {/* Attached Files & Clarifications Metadata */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.04]">
            {files.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-neutral-500">Files:</span>
                {files.map((f, i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-300"
                  >
                    <Paperclip className="w-3 h-3 text-neutral-400" />
                    <span>{f.filename}</span>
                    <span className="text-neutral-500 text-[10px]">({(f.size_bytes / 1024).toFixed(1)} KB)</span>
                  </span>
                ))}
              </div>
            )}

            {clarifications && Object.keys(clarifications).length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-mono text-neutral-500">Clarifications:</span>
                {Object.entries(clarifications).map(([k, v], idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] font-mono"
                  >
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            SECTION 2: ACCURATE PROGRESS BAR & REAL-TIME STATUS
           ========================================================================= */}
        <div className="bg-[#080808] border border-white/[0.08] rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2.5">
              {isExecuting ? (
                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span className="text-white font-medium">{stageMessage}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-wider text-neutral-400 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                Phase: {currentStage}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-500">Progress:</span>
                <span className="text-indigo-400 font-semibold text-sm">{progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Progress Track */}
          <div className="w-full h-2 rounded-full bg-white/[0.04] border border-white/[0.06] overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-500 ease-out rounded-full relative"
              style={{ width: `${progressPercent}%` }}
            >
              {isExecuting && (
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            SECTION 3: BIG, EXPANSIVE OUTPUT AREA (Full visualizer & deliverables)
           ========================================================================= */}
        <div className="space-y-6 animate-fadeIn">
          <LiveExecutionVisualizer
            currentStage={currentStage}
            stageMessage={stageMessage}
            structuredGoal={structuredGoal}
            blackboard={blackboard}
            activeSubtask={activeSubtask}
            finalEvaluation={finalEvaluation}
            isExecuting={isExecuting}
          />
        </div>

      </main>
    </div>
  );
};
