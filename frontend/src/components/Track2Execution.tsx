import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  X,
  Play,
  Paperclip,
  Sparkles
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

  const handleExecute = async (overridePrompt?: string) => {
    const taskPrompt = overridePrompt || prompt;
    if (!taskPrompt.trim()) return;

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
      setStageMessage(`Task execution finalized &bull; Score: ${data.final_evaluation.overall_completion_score}%`);
      setFinalEvaluation(data.final_evaluation);
      if (data.full_blackboard_state) {
        setBlackboard(data.full_blackboard_state);
      }
      setActiveSubtask(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-6">
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
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isExecuting}
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
              disabled={isUploading || isExecuting}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-transparent hover:bg-white/[0.05] text-xs font-medium text-neutral-300 hover:text-white border border-white/[0.1] hover:border-white/[0.2] transition-all disabled:opacity-50"
            >
              <Paperclip className="w-3.5 h-3.5 text-neutral-400" />
              <span>{isUploading ? 'Ingesting...' : 'Ingest File'}</span>
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

          {/* Pure White CTA Button (Resend signature) */}
          <button
            onClick={() => handleExecute()}
            disabled={isExecuting || !prompt.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            {isExecuting ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Orchestrating...
              </span>
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
                handleExecute(sc.prompt);
              }}
              disabled={isExecuting}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] text-neutral-400 hover:text-white border border-white/[0.06] transition-all font-mono"
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

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
