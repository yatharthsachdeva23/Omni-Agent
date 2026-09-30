import React, { useState, useRef } from 'react';
import {
  Zap,
  Upload,
  FileText,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Paperclip,
  Database,
  ArrowRight
} from 'lucide-react';
import {
  IngestedFile,
  StructuredGoal,
  BlackboardSnapshot,
  FinalEvaluationResult,
  StructuredSubTask
} from '../types';
import { LiveExecutionVisualizer } from './LiveExecutionVisualizer';

export const Track2Execution: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<IngestedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Live Telemetry States
  const [currentStage, setCurrentStage] = useState<string>('READY');
  const [stageMessage, setStageMessage] = useState<string>('Awaiting prompt and input data to begin orchestration...');
  const [structuredGoal, setStructuredGoal] = useState<StructuredGoal | null>(null);
  const [blackboard, setBlackboard] = useState<BlackboardSnapshot | null>(null);
  const [activeSubtask, setActiveSubtask] = useState<StructuredSubTask | null>(null);
  const [finalEvaluation, setFinalEvaluation] = useState<FinalEvaluationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const scenarios = [
    {
      label: "Full SaaS Architecture",
      prompt: "Perform statistical sales optimization for Q3, calculate maximum throughput parameters, write the production Python engine with input validation guardrails, generate a 16:9 modern technical infographic diagram, and run a final executive audit."
    },
    {
      label: "Financial Trading Bot",
      prompt: "Derive quantitative volatility equations, engineer an async Python risk-monitoring daemon, create visual risk-reward matrix charts, and compile an audit report."
    },
    {
      label: "Product Launch Suite",
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

  const handleExecute = async (overridePrompt?: string) => {
    const taskPrompt = overridePrompt || prompt;
    if (!taskPrompt.trim()) return;

    // Reset telemetry
    setIsExecuting(true);
    setCurrentStage('STARTING');
    setStageMessage('Initializing Omni Agent pipeline...');
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
          allow_simulation: true
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
    } else if (eventName === 'INTERMEDIATE_REVIEW_COMPLETED') {
      if (data.blackboard_snapshot) {
        setBlackboard(data.blackboard_snapshot);
      }
    } else if (eventName === 'EXECUTION_COMPLETED') {
      setCurrentStage('COMPLETED');
      setStageMessage(`Execution successfully finalized with score of ${data.final_evaluation.overall_completion_score}%`);
      setFinalEvaluation(data.final_evaluation);
      if (data.full_blackboard_state) {
        setBlackboard(data.full_blackboard_state);
      }
      setActiveSubtask(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5" />
          Autonomous Multi-Agent Orchestrator
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          One Prompt. Unlimited Agents. <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Automated Structuring, Jev Routing & Quality Verification.
          </span>
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Feed in your raw prompt and ingest files. Jev classifies and schedules the sub-tasks in milliseconds, specialized workers execute each step, domain reviewers inspect every output, and the Common Context Blackboard eliminates state amnesia.
        </p>
      </div>

      {/* Input & Ingestion Hub */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Task Objective (Natural Language):
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isExecuting}
            placeholder="Tell us what you want to execute in full natural language. Include files, requirements, math, code, or visual specifications..."
            rows={3}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none disabled:opacity-60"
          />
        </div>

        {/* Data Ingestion Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isExecuting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-xs font-semibold text-slate-200 border border-slate-700 transition-all disabled:opacity-50"
            >
              <Paperclip className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isUploading ? 'Ingesting...' : 'Ingest File / Dataset'}</span>
            </button>

            {/* Attached file tags */}
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-300 font-mono"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate max-w-[140px]">{file.filename}</span>
                <span className="text-[10px] text-cyan-500">({(file.size_bytes / 1024).toFixed(1)}KB)</span>
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

          {/* Execute CTA */}
          <button
            onClick={() => handleExecute()}
            disabled={isExecuting || !prompt.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isExecuting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                Orchestrating Agents...
              </span>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Execute with Omni Agent</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Demo Scenarios */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            Example Scenarios:
          </span>
          {scenarios.map((sc, i) => (
            <button
              key={i}
              onClick={() => {
                setPrompt(sc.prompt);
                handleExecute(sc.prompt);
              }}
              disabled={isExecuting}
              className="text-[11px] px-2.5 py-1 rounded-md bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all font-mono"
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Execution Visualizer */}
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
