import React, { useState } from 'react';
import { Send, Sparkles, Copy, Check, ExternalLink, Lightbulb, ArrowRight, ShieldCheck } from 'lucide-react';
import { AdvisorResponse, ToolRecommendation } from '../types';

export const Track1Advisor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdvisorResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const presets = [
    "I want to turn a scientific PDF into an engaging video podcast with animated diagrams",
    "Build a production algorithmic crypto trading bot with mathematical backtesting & code",
    "Launch an e-commerce brand with logo generation, copywriting, and sales analysis",
    "Analyze messy sales data CSV and generate predictive regression models with charts"
  ];

  const handleAdvise = async (queryText?: string) => {
    const q = queryText || prompt;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/advisor/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: q })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Hero Banner */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          Free AI Architect & Recommendation Engine
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Don't Know Which AI To Use? <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Let Omni Agent Recommend Your Exact Toolkit.
          </span>
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          Input any complex goal in natural language. We analyze your requirements across our onboarded matrix of 40+ leading AI tools and generate a comprehensive DIY execution blueprint for free.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to achieve in as much detail as possible (e.g. 'I want to build a real-time dashboard that calculates SaaS churn metrics, writes the backend API, and generates marketing visual graphics')..."
            rows={4}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
              <Lightbulb className="w-3 h-3 text-amber-400" /> Quick examples:
            </span>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(preset);
                  handleAdvise(preset);
                }}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-left truncate max-w-[200px]"
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleAdvise()}
            disabled={loading || !prompt.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                Analyzing Matrix...
              </span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Get Free Blueprint</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-8 animate-fadeIn">
          {/* Task Decomposition */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">01</span>
              Task Decomposition
            </h3>
            <p className="text-xs text-slate-400">
              Our analyzer has broken down your objective into sequential specialist stages:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.task_decomposition.map((stage, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-200">{stage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended AI Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">02</span>
                Prescribed Best-in-Class AIs
              </h3>
              <span className="text-xs text-slate-400">
                Hand-picked based on domain benchmarks
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {result.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {rec.category}
                        </span>
                        <h4 className="text-lg font-bold text-white mt-1">
                          {rec.tool_name}
                        </h4>
                        <p className="text-xs text-slate-400">Provider: {rec.provider}</p>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        rec.is_free ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {rec.pricing_tier}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {rec.description}
                    </p>

                    <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-xs text-emerald-300 flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                      <span><strong>Why this model:</strong> {rec.why_recommended}</span>
                    </div>
                  </div>

                  {/* Sample Prompt to Copy */}
                  <div className="pt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Ready-to-use Prompt:</span>
                      <button
                        onClick={() => copyToClipboard(rec.sample_prompt, idx)}
                        className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Prompt
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800/80 leading-relaxed overflow-x-auto">
                      {rec.sample_prompt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step-by-Step DIY Execution Blueprint */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-mono font-bold">03</span>
              Step-by-Step DIY Execution Guide
            </h3>
            <p className="text-xs text-slate-400">
              Follow this ordered pipeline yourself to achieve 100% of your target without paying for automated execution:
            </p>

            <div className="space-y-3">
              {result.diy_execution_blueprint.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-sm shrink-0">
                    {step.step}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-bold text-white">{step.action}</h5>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                        Tool: {step.recommended_tool}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{step.instruction}</p>
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
