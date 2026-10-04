import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  Play,
  Paperclip,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  IngestedFile,
  StructuredGoal,
  BlackboardSnapshot,
  FinalEvaluationResult,
  StructuredSubTask,
  InteractivePlanResponse
} from '../types';
import { LiveExecutionVisualizer } from './LiveExecutionVisualizer';
import { InteractivePlanCard } from './InteractivePlanCard';

interface Track2ExecutionProps {
  onLaunchExecution?: (params: {
    prompt: string;
    files: IngestedFile[];
    askBeforeDoing: boolean;
    clarifications?: Record<string, string>;
    approvedPlanSummary?: string;
  }) => void;
  initialPrompt?: string;
}

export const Track2Execution: React.FC<Track2ExecutionProps> = ({
  onLaunchExecution,
  initialPrompt = ''
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [files, setFiles] = useState<IngestedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // 'Ask Before Doing' State (Enabled by default as requested)
  const [askBeforeDoing, setAskBeforeDoing] = useState<boolean>(true);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const [interactivePlan, setInteractivePlan] = useState<InteractivePlanResponse | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [customNotes, setCustomNotes] = useState<string>('');

  // Live Telemetry States
  const [currentStage, setCurrentStage] = useState<string>('READY');
  const [stageMessage, setStageMessage] = useState<string>('Ready to orchestrate multi-agent workflow');
  const [structuredGoal, setStructuredGoal] = useState<StructuredGoal | null>(null);
  const [blackboard, setBlackboard] = useState<BlackboardSnapshot | null>(null);
  const [activeSubtask, setActiveSubtask] = useState<StructuredSubTask | null>(null);
  const [finalEvaluation, setFinalEvaluation] = useState<FinalEvaluationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const scenarios = [
    {
      label: "Fintech Microservice",
      prompt: "Perform statistical sales optimization for Q3, calculate maximum throughput parameters, write the production Python engine with input validation guardrails, generate a 16:9 modern technical infographic diagram, and run a final executive audit."
    },
    {
      label: "Algorithmic Risk Engine",
      prompt: "Derive quantitative volatility equations, engineer an async Python risk-monitoring daemon, create visual risk-reward matrix charts, and compile an audit report."
    },
    {
      label: "Product Analytics Suite",
      prompt: "Analyze user churn patterns from ingested dataset, write the backend analytics endpoint, create visual social media infographic assets, and synthesize executive launch documentation."
    }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data: IngestedFile = await res.json();
      setFiles(prev => [...prev, data]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Step 1: Formulate Implementation Plan & Clarifying Questions (Ask Before Doing)
  const handleFormulatePlan = async (overridePrompt?: string) => {
    const taskPrompt = overridePrompt || prompt;
    if (!taskPrompt.trim()) return;

    setIsPlanning(true);
    try {
      const res = await fetch('/api/interactive-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: taskPrompt,
          files: files
        })
      });
      if (!res.ok) throw new Error('Failed to generate interactive plan');
      const planData: InteractivePlanResponse = await res.json();
      setInteractivePlan(planData);

      // Pre-select defaults
      const initialAnswers: Record<string, string> = {};
      if (planData.clarifying_questions) {
        planData.clarifying_questions.forEach(q => {
          initialAnswers[q.id] = q.default_selected || (q.options[0] || '');
        });
      }
      setUserAnswers(initialAnswers);
    } catch (err) {
      console.error('Plan formulation error:', err);
      // Fallback: If plan formulation fails, proceed directly
      handleExecute(taskPrompt);
    } finally {
      setIsPlanning(false);
    }
  };

  // Step 2: Approve & Execute with user answers incorporated
  const handleExecuteWithApprovedPlan = () => {
    if (!interactivePlan) return;

    // Combine answers with custom notes
    const finalClarifications = { ...userAnswers };
    if (customNotes.trim()) {
      finalClarifications["Additional Custom Directives"] = customNotes.trim();
    }

    const planSummary = `Objective: ${interactivePlan.objective_summary}. Approach: ${interactivePlan.architectural_approach}. Steps: ${interactivePlan.steps.map(s => s.title).join(' -> ')}`;

    handleExecute(prompt, finalClarifications, planSummary);
  };

  const handleExecute = async (
    overridePrompt?: string,
    clarifications?: Record<string, string>,
    planSummary?: string
  ) => {
    const taskPrompt = overridePrompt || prompt;
    if (!taskPrompt.trim()) return;

    if (onLaunchExecution) {
      onLaunchExecution({
        prompt: taskPrompt,
        files: files,
        askBeforeDoing: askBeforeDoing,
        clarifications: clarifications || (interactivePlan ? userAnswers : undefined),
        approvedPlanSummary: planSummary || (interactivePlan ? interactivePlan.architectural_approach : undefined)
      });
      return;
    }

    setIsExecuting(true);
    setCurrentStage('STARTING');
    setStageMessage('Initializing OmniTask AI pipeline...');
    setStructuredGoal(null);
    setBlackboard(null);
    setActiveSubtask(null);
    setFinalEvaluation(null);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: taskPrompt,
          files: files,
          mode: 'paid',
          allow_simulation: true,
          ask_before_doing: askBeforeDoing,
          user_clarifications: clarifications || (interactivePlan ? userAnswers : undefined),
          approved_plan_summary: planSummary || (interactivePlan ? interactivePlan.architectural_approach : undefined)
        })
      });

      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
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
      console.error('Execution error:', err);
      setCurrentStage('ERROR');
      setStageMessage('Encountered an issue during execution.');
    } finally {
      setIsExecuting(false);
    }
  };

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

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 pt-6">
      {/* Editorial Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs text-neutral-300">
          <Sparkles className="w-3 h-3 text-neutral-400" />
          <span>Track 2 &bull; Autonomous Multi-Agent Execution</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-white leading-[1.15]">
          One prompt. Infinite agents. <br />
          <span className="text-neutral-400">Structured, routed, and verified.</span>
        </h1>

        <p className="text-sm text-neutral-400 leading-relaxed max-w-lg mx-auto">
          Ingest raw prompts and datasets. Jev routes tasks in milliseconds, specialized models (Qwen, Mistral, Gemini, GPT, Flux.1) execute, and Gemini inspects every step before commit.
        </p>
      </div>

      {/* Input & Ingestion Card */}
      <div className="bg-[#080808] border border-white/[0.08] rounded-2xl p-5 shadow-2xl space-y-5">
        <textarea
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (interactivePlan) setInteractivePlan(null);
          }}
          disabled={isExecuting || isPlanning}
          placeholder="State your complex task in natural language. Ingest data files or paste context below..."
          rows={3}
          className="w-full bg-[#030303] border border-white/[0.08] rounded-xl p-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all resize-none font-sans disabled:opacity-50"
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isExecuting || isPlanning}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-transparent hover:bg-white/[0.05] text-xs font-medium text-neutral-300 hover:text-white border border-white/[0.1] hover:border-white/[0.2] transition-all disabled:opacity-50"
            >
              <Paperclip className="w-3.5 h-3.5 text-neutral-400" />
              <span>{isUploading ? 'Ingesting...' : 'Ingest File'}</span>
            </button>

            {/* TOGGLE BUTTON: Ask Before Doing */}
            <button
              type="button"
              onClick={() => {
                const nextState = !askBeforeDoing;
                setAskBeforeDoing(nextState);
                if (!nextState) {
                  setInteractivePlan(null);
                }
              }}
              disabled={isExecuting || isPlanning}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all select-none ${
                askBeforeDoing
                  ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/15 hover:border-emerald-500/50 shadow-sm'
                  : 'bg-white/[0.02] border-white/[0.08] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05]'
              }`}
              title={
                askBeforeDoing
                  ? "Ask Before Doing (Active): Analyzes objective, outlines implementation plan, and asks clarifying questions before execution."
                  : "Ask Before Doing (Disabled): Directly executes full autonomous pipeline in one shot without asking."
              }
            >
              {/* Pill Switch */}
              <div
                className={`w-7 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                  askBeforeDoing ? 'bg-emerald-500 justify-end' : 'bg-neutral-700 justify-start'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-black shadow-sm transition-transform"></div>
              </div>
              <span className="font-medium">Ask Before Doing</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider font-semibold ${
                  askBeforeDoing ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/[0.06] text-neutral-400'
                }`}
              >
                {askBeforeDoing ? 'ON' : 'OFF'}
              </span>
            </button>

            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-neutral-300 font-mono"
              >
                <FileText className="w-3.5 h-3.5 text-neutral-400" />
                <span className="truncate max-w-[120px]">{file.filename}</span>
                <span className="text-[10px] text-neutral-500">({(file.size_bytes / 1024).toFixed(1)}KB)</span>
                {!isExecuting && (
                  <button
                    onClick={() => removeFile(idx)}
                    className="p-0.5 hover:text-white rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Primary Action CTA Button */}
          <button
            onClick={() => {
              if (askBeforeDoing && !interactivePlan) {
                handleFormulatePlan();
              } else if (askBeforeDoing && interactivePlan) {
                handleExecuteWithApprovedPlan();
              } else {
                handleExecute();
              }
            }}
            disabled={isExecuting || isPlanning || !prompt.trim()}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm ${
              askBeforeDoing && !interactivePlan
                ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-emerald-500/20'
                : 'bg-white hover:bg-neutral-200 text-black'
            }`}
          >
            {isPlanning ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Formulating Plan &amp; Questions...
              </span>
            ) : isExecuting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Orchestrating...
              </span>
            ) : askBeforeDoing && !interactivePlan ? (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-black" />
                <span>Plan &amp; Ask Questions</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Execute Workflow</span>
              </>
            )}
          </button>
        </div>

        {/* Example Scenarios */}
        <div className="pt-1 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-neutral-500">Presets:</span>
          {scenarios.map((sc, i) => (
            <button
              key={i}
              onClick={() => {
                setPrompt(sc.prompt);
                setInteractivePlan(null);
                if (askBeforeDoing) {
                  handleFormulatePlan(sc.prompt);
                } else {
                  handleExecute(sc.prompt);
                }
              }}
              disabled={isExecuting || isPlanning}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] text-neutral-400 hover:text-white border border-white/[0.06] transition-all font-mono"
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Plan Card (When Ask Before Doing is ON and plan is ready) */}
      {interactivePlan && !isExecuting && (
        <InteractivePlanCard
          plan={interactivePlan}
          userAnswers={userAnswers}
          onAnswerChange={(qId, ans) => setUserAnswers(prev => ({ ...prev, [qId]: ans }))}
          customNotes={customNotes}
          onCustomNotesChange={setCustomNotes}
          onApproveAndExecute={handleExecuteWithApprovedPlan}
          onCancelOrRevise={() => setInteractivePlan(null)}
          isExecuting={isExecuting}
        />
      )}

      {/* Live Telemetry View */}
      {(structuredGoal || isExecuting || finalEvaluation) && (
        <div className="animate-fadeIn">
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
      )}
    </div>
  );
};
