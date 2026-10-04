import React, { useState } from 'react';
import { X, Info, BookOpen, Mail, HelpCircle, Sparkles, ExternalLink, ShieldCheck, Cpu } from 'lucide-react';

export type NavModalTab = 'about' | 'docs' | 'contact' | 'help';

interface SampleNavModalProps {
  isOpen: boolean;
  initialTab?: NavModalTab;
  onClose: () => void;
}

export const SampleNavModal: React.FC<SampleNavModalProps> = ({
  isOpen,
  initialTab = 'about',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<NavModalTab>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#090a0f] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <img
              src="/omnitask-logo.png"
              alt="OmniTask AI"
              className="h-6 w-auto object-contain"
            />
            <div className="border-l border-white/[0.1] pl-3">
              <h3 className="text-sm font-semibold text-white tracking-tight">Portal &amp; Guides</h3>
              <p className="text-[11px] font-mono text-neutral-400">Autonomous Orchestration Swarm</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center px-5 pt-3 border-b border-white/[0.06] gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'about'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About Us</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'docs'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Documentation</span>
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'contact'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact</span>
          </button>
          <button
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'help'
                ? 'border-white text-white font-semibold'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help & FAQ</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-neutral-300 leading-relaxed font-sans">
          {/* TAB: ABOUT US */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-2">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  What is OmniTask AI?
                </h4>
                <p className="text-neutral-300">
                  OmniTask AI is an advanced autonomous multi-agent platform designed to solve complex software engineering, 
                  quantitative analysis, visual generation, and multimodal workflows through unified orchestration.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[#030303] border border-white/[0.06] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-emerald-400">Track 1 Engine</span>
                  <h5 className="font-semibold text-white">Architectural Advisor</h5>
                  <p className="text-neutral-400 text-[11px]">
                    Provides zero-cost AI architectural blueprints, tool selection, and DIY roadmaps for ambitious builders.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#030303] border border-white/[0.06] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-indigo-400">Track 2 Engine</span>
                  <h5 className="font-semibold text-white">Autonomous Worker Swarm</h5>
                  <p className="text-neutral-400 text-[11px]">
                    Executes end-to-end tasks with Jev System 1 routing, Qwen 2.5 Coder, Flux.1 visuals, and Gemini QA gates.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-neutral-400 text-[11px] font-mono">
                <span>Architecture: Python 3.12 • React 18 • Vite</span>
                <span>Version 2.4.0</span>
              </div>
            </div>
          )}

          {/* TAB: DOCUMENTATION */}
          {activeTab === 'docs' && (
            <div className="space-y-3.5">
              <h4 className="text-sm font-semibold text-white">Architecture & API Guide</h4>
              <p className="text-neutral-400">
                OmniTask AI decomposes every prompt into a sequential Directed Acyclic Graph (DAG) with synchronized blackboard state.
              </p>

              <div className="space-y-2">
                <div className="p-3 rounded-lg bg-[#030303] border border-white/[0.06] font-mono text-[11px] space-y-1">
                  <span className="text-emerald-400">POST /api/execute</span>
                  <p className="text-neutral-400 font-sans text-xs">
                    Streams SSE telemetry for structuring, Jev routing, worker generation, and intermediate QA reviews.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#030303] border border-white/[0.06] font-mono text-[11px] space-y-1">
                  <span className="text-cyan-400">POST /api/upload</span>
                  <p className="text-neutral-400 font-sans text-xs">
                    Ingests PDFs, DOCX, TXT files up to 50MB with automated text extraction and vector indexing.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#030303] border border-white/[0.06] font-mono text-[11px] space-y-1">
                  <span className="text-amber-400">POST /api/advisor</span>
                  <p className="text-neutral-400 font-sans text-xs">
                    Produces a complete architectural blueprint, tool directory recommendations, and DIY milestone roadmap.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTACT */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-white">Connect & Support</h4>
              <p className="text-neutral-400">
                OmniTask AI is maintained as an active research project for Advanced Agentic Coding and swarm orchestration.
              </p>

              <div className="space-y-2.5">
                <div className="p-3.5 rounded-xl bg-[#030303] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-white">GitHub Repository</h5>
                    <p className="text-[11px] text-neutral-400 font-mono">yatharthsachdeva23/Omni-Agent</p>
                  </div>
                  <a
                    href="https://github.com/yatharthsachdeva23/Omni-Agent"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white text-xs transition"
                  >
                    <span>View GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3.5 rounded-xl bg-[#030303] border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <h5 className="font-semibold text-white">Local Server Endpoint</h5>
                    <p className="text-[11px] text-neutral-400 font-mono">http://localhost:8001</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: HELP & FAQ */}
          {activeTab === 'help' && (
            <div className="space-y-3.5">
              <h4 className="text-sm font-semibold text-white">Frequently Asked Questions</h4>
              
              <div className="space-y-2.5">
                <details className="p-3 rounded-xl bg-[#030303] border border-white/[0.06] group cursor-pointer">
                  <summary className="font-medium text-white flex items-center justify-between">
                    <span>How does Jev System 1 Routing work?</span>
                    <span className="text-neutral-500 group-open:rotate-180 transition">&darr;</span>
                  </summary>
                  <p className="mt-2 text-neutral-400 text-xs">
                    Jev uses sub-millisecond heuristic classification to instantly route subtasks to the most qualified worker specialist, avoiding unnecessary multi-second model latency.
                  </p>
                </details>

                <details className="p-3 rounded-xl bg-[#030303] border border-white/[0.06] group cursor-pointer">
                  <summary className="font-medium text-white flex items-center justify-between">
                    <span>How do I download generated deliverables?</span>
                    <span className="text-neutral-500 group-open:rotate-180 transition">&darr;</span>
                  </summary>
                  <p className="mt-2 text-neutral-400 text-xs">
                    Every completed worker step and final deliverable features a dedicated Download button that saves files in their native format (.html, .py, .jpg, .md) directly to your machine.
                  </p>
                </details>

                <details className="p-3 rounded-xl bg-[#030303] border border-white/[0.06] group cursor-pointer">
                  <summary className="font-medium text-white flex items-center justify-between">
                    <span>Can I run workflows offline?</span>
                    <span className="text-neutral-500 group-open:rotate-180 transition">&darr;</span>
                  </summary>
                  <p className="mt-2 text-neutral-400 text-xs">
                    Yes. OmniTask AI includes dynamic offline autonomous generators that synthesize clean code, mathematical derivations, and executive syntheses even if cloud APIs are unavailable.
                  </p>
                </details>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.01] flex items-center justify-between">
          <span className="text-[11px] font-mono text-neutral-500">Press ESC or click outside to close</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
