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
  ExternalLink,
  Copy,
  Check,
  Download
} from 'lucide-react';
import {
  StructuredGoal,
  BlackboardSnapshot,
  FinalEvaluationResult,
  StructuredSubTask,
} from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface LiveExecutionVisualizerProps {
  currentStage: string;
  stageMessage: string;
  structuredGoal: StructuredGoal | null;
  blackboard: BlackboardSnapshot | null;
  activeSubtask: StructuredSubTask | null;
  finalEvaluation: FinalEvaluationResult | null;
  isExecuting: boolean;
}

interface FileDownloadInfo {
  filename: string;
  content: string;
  mimeType: string;
  isImage?: boolean;
  imageUrl?: string;
  extension: string;
}

const parseDeliverableFile = (
  title: string,
  text: string,
  domain: string,
  artifacts?: Record<string, any>
): FileDownloadInfo => {
  const safeName =
    title
      .toLowerCase()
      .replace(/^(modular implementation & architecture for|web & ui implementation for|visual asset render for|compose creative poem for|execution & synthesis of|in-depth synthesis & deliverable generation for)\s*/i, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 36) || 'deliverable';

  // 1. Check for Image asset
  if (artifacts?.image_url) {
    return {
      filename: `${safeName}.jpg`,
      content: '',
      mimeType: 'image/jpeg',
      isImage: true,
      imageUrl: artifacts.image_url,
      extension: 'JPG',
    };
  }

  // 2. Check for fenced code blocks
  const codeMatch = text.match(/```([a-zA-Z0-9_+-]*)\s*\n([\s\S]*?)```/);
  if (codeMatch) {
    const lang = (codeMatch[1] || '').toLowerCase().trim();
    const codeContent = codeMatch[2].trim();

    if (lang === 'html' || lang === 'htm' || codeContent.toLowerCase().includes('<!doctype') || codeContent.toLowerCase().includes('<html')) {
      return {
        filename: `${safeName}.html`,
        content: codeContent,
        mimeType: 'text/html',
        extension: 'HTML',
      };
    }
    if (lang === 'css') {
      return {
        filename: `${safeName}.css`,
        content: codeContent,
        mimeType: 'text/css',
        extension: 'CSS',
      };
    }
    if (lang === 'python' || lang === 'py') {
      return {
        filename: `${safeName}.py`,
        content: codeContent,
        mimeType: 'text/x-python',
        extension: 'PY',
      };
    }
    if (lang === 'javascript' || lang === 'js') {
      return {
        filename: `${safeName}.js`,
        content: codeContent,
        mimeType: 'application/javascript',
        extension: 'JS',
      };
    }
    if (lang === 'typescript' || lang === 'ts') {
      return {
        filename: `${safeName}.ts`,
        content: codeContent,
        mimeType: 'application/typescript',
        extension: 'TS',
      };
    }
    if (lang === 'sql') {
      return {
        filename: `${safeName}.sql`,
        content: codeContent,
        mimeType: 'application/sql',
        extension: 'SQL',
      };
    }
    if (lang === 'json') {
      return {
        filename: `${safeName}.json`,
        content: codeContent,
        mimeType: 'application/json',
        extension: 'JSON',
      };
    }
    const ext = lang ? lang.toUpperCase() : 'TXT';
    return {
      filename: `${safeName}.${lang || 'txt'}`,
      content: codeContent,
      mimeType: 'text/plain',
      extension: ext,
    };
  }

  // 3. Fallback: Markdown document or plain text
  const isMarkdown = text.includes('#') || text.includes('**') || text.includes('\n- ') || domain === 'audit' || domain === 'math';
  return {
    filename: `${safeName}.${isMarkdown ? 'md' : 'txt'}`,
    content: text,
    mimeType: isMarkdown ? 'text/markdown' : 'text/plain',
    extension: isMarkdown ? 'MD' : 'TXT',
  };
};

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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [rawViewSteps, setRawViewSteps] = useState<Record<string, boolean>>({});

  const handleCopy = (key: string, text: string) => {
    const codeMatch = text.match(/```(?:[a-zA-Z0-9_+-]*)\s*\n([\s\S]*?)```/);
    const textToCopy = codeMatch ? codeMatch[1].trim() : text;
    navigator.clipboard.writeText(textToCopy);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const handleDownload = async (fileInfo: FileDownloadInfo) => {
    if (fileInfo.isImage && fileInfo.imageUrl) {
      try {
        const response = await fetch(fileInfo.imageUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileInfo.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch {
        const a = document.createElement('a');
        a.href = fileInfo.imageUrl;
        a.download = fileInfo.filename;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      return;
    }

    const blob = new Blob([fileInfo.content], { type: fileInfo.mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileInfo.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

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
                        <span>Reviewer: <strong className="text-neutral-300">{task.assigned_reviewer_model || 'Gemini 3.5 Flash'}</strong></span>
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
                    {output && (() => {
                      const fileInfo = parseDeliverableFile(
                        task.title,
                        output.output_text,
                        task.domain,
                        output.artifacts
                      );
                      const isOutputCopied = copiedKey === `step_${task.step_id}`;
                      return (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                            <span>Output ({output.worker_model}) &bull; {output.execution_time_ms} ms</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() =>
                                  setRawViewSteps((prev) => ({
                                    ...prev,
                                    [task.step_id]: !prev[task.step_id],
                                  }))
                                }
                                className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition text-[11px] font-mono border border-white/[0.08]"
                                title="Toggle rendered Markdown/Math vs raw plain text"
                              >
                                <span>{rawViewSteps[task.step_id] ? 'View Formatted' : 'View Raw'}</span>
                              </button>
                              <button
                                onClick={() => handleCopy(`step_${task.step_id}`, output.output_text)}
                                className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition text-[11px] font-mono border border-white/[0.08]"
                                title="Copy code/text to clipboard"
                              >
                                {isOutputCopied ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-neutral-400" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDownload(fileInfo)}
                                className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-neutral-200 hover:text-white transition text-[11px] font-mono border border-white/[0.1]"
                                title={`Download as .${fileInfo.extension.toLowerCase()}`}
                              >
                                <Download className="w-3 h-3 text-neutral-300" />
                                <span>Download (.{fileInfo.extension.toLowerCase()})</span>
                              </button>
                            </div>
                          </div>
                          {output.artifacts?.image_url && (
                            <div className="rounded-xl overflow-hidden border border-white/[0.12] bg-[#050505] p-2 space-y-2">
                              <img
                                src={output.artifacts.image_url}
                                alt="Generated Visual Asset"
                                className="w-full h-auto max-h-96 object-contain rounded-lg shadow-xl"
                                loading="lazy"
                              />
                              <div className="flex items-center justify-between px-1 text-[11px] font-mono text-neutral-400">
                                <span>Flux.1 Synthesis • 1280x720</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleDownload(fileInfo)}
                                    className="text-neutral-300 hover:text-white flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] transition text-[11px]"
                                    title="Download image (.jpg)"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download Image (.jpg)</span>
                                  </button>
                                  <a
                                    href={output.artifacts.image_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-white hover:underline flex items-center gap-1"
                                  >
                                    Open Full Size &rarr;
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                          {rawViewSteps[task.step_id] ? (
                            <pre className="p-4 rounded-xl bg-[#020202] border border-white/[0.08] font-mono text-xs text-neutral-200 overflow-x-auto whitespace-pre-wrap leading-relaxed min-h-[220px] max-h-[650px] overflow-y-auto selection:bg-indigo-500/30">
                              {output.output_text}
                            </pre>
                          ) : (
                            <div className="p-4 rounded-xl bg-[#020202] border border-white/[0.08] text-xs text-neutral-200 min-h-[220px] max-h-[650px] overflow-y-auto selection:bg-indigo-500/30">
                              <MarkdownRenderer content={output.output_text} />
                            </div>
                          )}
                        </div>
                      );
                    })()}

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

          {/* Inter-Agent Handovers (Dual-Channel State) */}
          {blackboard.inter_agent_handovers && Object.keys(blackboard.inter_agent_handovers).length > 0 && (
            <div className="p-5 rounded-2xl bg-[#080808] border border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Inter-Agent Handovers & Dual-Channel Coordination
                </h4>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/[0.08] px-2 py-0.5 rounded border border-cyan-500/20">
                  Leak Prevention Shield
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Internal parameters, directives, and target objects passed privately between swarm specialists (cleanly decoupled from user deliverables):
              </p>
              <div className="space-y-2 font-mono text-xs">
                {Object.entries(blackboard.inter_agent_handovers).map(([stepId, handoverData]) => (
                  <div key={stepId} className="p-3 rounded-xl bg-[#030303] border border-white/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                      <span className="font-semibold text-white uppercase">STAGE {stepId} &rarr; DOWNSTREAM AGENTS</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {Object.entries(handoverData).map(([k, v]) => (
                        <div key={k} className="p-2 rounded bg-white/[0.03] border border-white/[0.04]">
                          <span className="text-neutral-500">{k}:</span>{' '}
                          <span className="text-cyan-300 font-semibold">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              {Object.entries(finalEvaluation.deliverables).map(([id, del]) => {
                const fileInfo = parseDeliverableFile(del.title, del.summary, del.domain, del.artifacts);
                const isDelCopied = copiedKey === `del_${id}`;
                return (
                  <div key={id} className="p-4 rounded-xl bg-[#030303] border border-white/[0.06] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDomainIcon(del.domain)}
                        <h5 className="text-xs font-medium text-white capitalize">{del.title}</h5>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-neutral-400 uppercase">
                          {del.domain}
                        </span>
                        <button
                          onClick={() =>
                            setRawViewSteps((prev) => ({
                              ...prev,
                              [`del_${id}`]: !prev[`del_${id}`],
                            }))
                          }
                          className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition text-[11px] font-mono border border-white/[0.08]"
                          title="Toggle rendered Markdown/Math vs raw plain text"
                        >
                          <span>{rawViewSteps[`del_${id}`] ? 'View Formatted' : 'View Raw'}</span>
                        </button>
                        <button
                          onClick={() => handleCopy(`del_${id}`, del.summary)}
                          className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/[0.04] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition text-[11px] font-mono border border-white/[0.08]"
                          title="Copy deliverable content"
                        >
                          {isDelCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-neutral-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDownload(fileInfo)}
                          className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.14] text-neutral-200 hover:text-white transition text-[11px] font-mono border border-white/[0.1]"
                          title={`Download ${fileInfo.filename}`}
                        >
                          <Download className="w-3 h-3 text-neutral-300" />
                          <span>Download (.{fileInfo.extension.toLowerCase()})</span>
                        </button>
                      </div>
                    </div>

                    {del.artifacts?.image_url && (
                      <div className="rounded-xl overflow-hidden border border-white/[0.12] bg-[#050505] p-2 space-y-2">
                        <img
                          src={del.artifacts.image_url}
                          alt={del.title}
                          className="w-full h-auto max-h-96 object-contain rounded-lg"
                          loading="lazy"
                        />
                        <div className="flex items-center justify-between px-1 text-[11px] font-mono text-neutral-400">
                          <span>Flux.1 Asset</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownload(fileInfo)}
                              className="text-neutral-300 hover:text-white flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition text-[11px]"
                              title="Download image (.jpg)"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download Image (.jpg)</span>
                            </button>
                            <a
                              href={del.artifacts.image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-white hover:underline flex items-center gap-1"
                            >
                              Open Full Size &rarr;
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {rawViewSteps[`del_${id}`] ? (
                      <pre className="p-4 rounded-xl bg-[#000000] font-mono text-xs text-neutral-200 min-h-[220px] max-h-[650px] overflow-y-auto whitespace-pre-wrap border border-white/[0.08] selection:bg-indigo-500/30">
                        {del.summary}
                      </pre>
                    ) : (
                      <div className="p-4 rounded-xl bg-[#000000] text-xs text-neutral-200 min-h-[220px] max-h-[650px] overflow-y-auto border border-white/[0.08] selection:bg-indigo-500/30">
                        <MarkdownRenderer content={del.summary} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
