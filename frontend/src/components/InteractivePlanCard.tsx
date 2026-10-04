import React from 'react';
import {
  CheckCircle2,
  Code2,
  Calculator,
  Image as ImageIcon,
  FileCheck,
  Cpu,
  Layers,
  Sparkles,
  HelpCircle,
  Play,
  X,
  ArrowRight,
  MessageSquare,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import {
  InteractivePlanResponse,
  ImplementationStepPlan,
  PlanClarifyingQuestion
} from '../types';

interface InteractivePlanCardProps {
  plan: InteractivePlanResponse;
  userAnswers: Record<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  customNotes: string;
  onCustomNotesChange: (notes: string) => void;
  onApproveAndExecute: () => void;
  onCancelOrRevise: () => void;
  isExecuting: boolean;
}

const getDomainIcon = (domain: string) => {
  switch (domain.toLowerCase()) {
    case 'code':
      return <Code2 className="w-3.5 h-3.5 text-emerald-400" />;
    case 'math':
      return <Calculator className="w-3.5 h-3.5 text-amber-400" />;
    case 'vision':
      return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
    default:
      return <FileCheck className="w-3.5 h-3.5 text-indigo-400" />;
  }
};

const getDomainBadgeColor = (domain: string) => {
  switch (domain.toLowerCase()) {
    case 'code':
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    case 'math':
      return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    case 'vision':
      return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
    default:
      return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
  }
};

export const InteractivePlanCard: React.FC<InteractivePlanCardProps> = ({
  plan,
  userAnswers,
  onAnswerChange,
  customNotes,
  onCustomNotesChange,
  onApproveAndExecute,
  onCancelOrRevise,
  isExecuting,
}) => {
  return (
    <div className="bg-[#090a0f] border border-emerald-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden space-y-7 animate-in fade-in-50 duration-300">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-300 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ASK BEFORE DOING &bull; INTERACTIVE PLAN GATE</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
            Proposed Implementation Plan
          </h2>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            OmniTask AI analyzed your request. Review the planned execution steps, select your preferences on the clarifying questions, or approve to start the swarm.
          </p>
        </div>

        <button
          onClick={onCancelOrRevise}
          disabled={isExecuting}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] transition"
        >
          <X className="w-3.5 h-3.5" />
          <span>Revise Prompt</span>
        </button>
      </div>

      {/* Objective & Architecture Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Understood Objective
          </span>
          <p className="text-xs text-neutral-200 leading-relaxed font-medium">
            {plan.objective_summary}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-indigo-400" />
            Architectural Strategy
          </span>
          <p className="text-xs text-neutral-300 leading-relaxed">
            {plan.architectural_approach}
          </p>
        </div>
      </div>

      {/* Sequential Execution Steps */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Planned Swarm Steps ({plan.steps.length})</span>
          </h3>
          <span className="text-[11px] text-neutral-500 font-mono">Specialist Model Assignments</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {plan.steps.map((step) => (
            <div
              key={step.step_number}
              className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.035] border border-white/[0.06] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-xs font-mono font-semibold text-white shrink-0 mt-0.5">
                  {step.step_number}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-white">{step.title}</span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${getDomainBadgeColor(step.domain)}`}>
                      {getDomainIcon(step.domain)}
                      <span className="uppercase">{step.domain}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="sm:text-right shrink-0 pl-10 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/[0.04]">
                <div className="text-[11px] font-mono text-emerald-300 font-medium truncate max-w-[220px]">
                  {step.assigned_worker}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono">
                  &rarr; {step.expected_output}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assumptions Made */}
      {plan.assumptions && plan.assumptions.length > 0 && (
        <div className="p-3.5 rounded-xl bg-white/[0.015] border border-white/[0.05] space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            Key Assumptions Made by Agent
          </span>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-300">
            {plan.assumptions.map((assump, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">&bull;</span>
                <span className="leading-snug">{assump}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CLARIFYING QUESTIONS SECTION */}
      {plan.clarifying_questions && plan.clarifying_questions.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-white/[0.08]">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Clarifying Questions & Tailoring</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Select your preference below to guide the models, or click &quot;Approve &amp; Launch&quot; to accept the defaults.
            </p>
          </div>

          <div className="space-y-4">
            {plan.clarifying_questions.map((q, qIdx) => {
              const currentVal = userAnswers[q.id] ?? q.default_selected ?? (q.options[0] || '');
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl bg-white/[0.025] border border-white/[0.08] space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] flex items-center justify-center shrink-0">
                      {qIdx + 1}
                    </span>
                    <h4 className="text-xs font-semibold text-white leading-relaxed">
                      {q.question}
                    </h4>
                  </div>

                  {/* Multiple Choice Options */}
                  <div className="flex flex-wrap gap-2 pl-7">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = currentVal === opt;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => onAnswerChange(q.id, opt)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 font-medium shadow-sm'
                              : 'bg-white/[0.02] border-white/[0.06] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.05]'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full border transition-all ${
                              isSelected
                                ? 'bg-emerald-400 border-emerald-300'
                                : 'border-neutral-500 bg-transparent'
                            }`}
                          />
                          <span>{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Optional Custom Text Overwrite */}
                  {q.allow_custom && (
                    <div className="pl-7 pt-1">
                      <input
                        type="text"
                        placeholder="Or type a custom specification for this question..."
                        value={q.options.includes(currentVal) ? '' : currentVal}
                        onChange={(e) => onAnswerChange(q.id, e.target.value)}
                        className="w-full bg-[#040406] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 transition font-sans"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Custom Instructions Box */}
      <div className="space-y-2 pt-1 border-t border-white/[0.06]">
        <label className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-neutral-400" />
          <span>Additional Constraints or Directives (Optional)</span>
        </label>
        <textarea
          rows={2}
          value={customNotes}
          onChange={(e) => onCustomNotesChange(e.target.value)}
          placeholder="e.g. Include sound effects, ensure WCAG AA accessibility, or add unit tests..."
          className="w-full bg-[#040406] border border-white/[0.08] rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500/50 transition resize-none font-sans"
        />
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
        <button
          type="button"
          onClick={onCancelOrRevise}
          disabled={isExecuting}
          className="px-4 py-2.5 rounded-xl text-xs text-neutral-400 hover:text-white bg-transparent hover:bg-white/[0.05] border border-white/[0.08] transition text-center"
        >
          Cancel &bull; Edit Prompt
        </button>

        <button
          type="button"
          onClick={onApproveAndExecute}
          disabled={isExecuting}
          className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-semibold text-xs tracking-tight transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99]"
        >
          {isExecuting ? (
            <>
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
              <span>Launching Swarm Execution...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Approve Plan &amp; Execute Swarm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
