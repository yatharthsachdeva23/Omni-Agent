import React, { useState } from 'react';
import { Send, Copy, Check, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { AdvisorResponse } from '../types';

export const Track1Advisor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdvisorResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const presets = [
    "Turn a research paper PDF into a video podcast with animated visual charts",
    "Engineer an algorithmic crypto trading bot with mathematical backtesting and risk guards",
    "Analyze Q3 sales revenue CSV, calculate growth coefficients, and generate an executive report",
    "Launch an e-commerce brand with logo generation, copywriting, and analytics"
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
    <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-6">
      {/* Editorial Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs text-neutral-300">
          <Sparkles className="w-3 h-3 text-neutral-400" />
          <span>Track 1 &bull; Free AI Recommendation Engine</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-white leading-[1.15]">
          Don't know which AI to use? <br />
          <span className="text-neutral-400">Let Omni Agent prescribe your toolkit.</span>
        </h1>

        <p className="text-sm text-neutral-400 leading-relaxed max-w-lg mx-auto">
          Describe any complex workflow in plain text. We evaluate your task against our directory of 40+ premier models and generate an exact DIY execution blueprint for free.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-[#080808] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your goal in natural language (e.g. 'I want to build a real-time SaaS churn forecasting engine with mathematical models, Python script, and marketing infographics')..."
          rows={3}
          className="w-full bg-[#030303] border border-white/[0.08] rounded-xl p-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/30 transition-all resize-none font-sans"
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-neutral-500 mr-1">Examples:</span>
            {presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPrompt(preset);
                  handleAdvise(preset);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] text-neutral-400 hover:text-white border border-white/[0.06] transition-all text-left truncate max-w-[160px]"
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            onClick={() => handleAdvise()}
            disabled={loading || !prompt.trim()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                Evaluating Matrix...
              </span>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Get Free Blueprint</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-10 animate-fadeIn">
          {/* Task Decomposition */}
          <div className="bg-[#080808] border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-white/[0.06] text-neutral-300 flex items-center justify-center text-[10px] font-mono">01</span>
                Task Decomposition
              </h3>
              <span className="text-xs text-neutral-500 font-mono">Sequential breakdown</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {result.task_decomposition.map((stage, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[#030303] border border-white/[0.06]">
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="text-xs text-neutral-300 font-medium">{stage}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prescribed AIs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-white/[0.06] text-neutral-300 flex items-center justify-center text-[10px] font-mono">02</span>
                Recommended Best-in-Class Models
              </h3>
              <span className="text-xs text-neutral-500 font-mono">Domain matched</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="bg-[#080808] border border-white/[0.08] hover:border-white/[0.18] rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                          {rec.category}
                        </span>
                        <h4 className="text-base font-medium text-white mt-0.5">
                          {rec.tool_name}
                        </h4>
                        <p className="text-[11px] text-neutral-500">{rec.provider}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/[0.1] bg-white/[0.03] text-neutral-300">
                        {rec.pricing_tier}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {rec.description}
                    </p>

                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-neutral-300 flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <span>{rec.why_recommended}</span>
                    </div>
                  </div>

                  {/* Sample Prompt to Copy */}
                  <div className="pt-2 space-y-1.5 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span>Ready-to-use Prompt</span>
                      <button
                        onClick={() => copyToClipboard(rec.sample_prompt, idx)}
                        className="flex items-center gap-1 text-white hover:text-neutral-300 transition-colors"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3 rounded-xl bg-[#030303] font-mono text-[11px] text-neutral-300 border border-white/[0.06] leading-relaxed overflow-x-auto">
                      {rec.sample_prompt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DIY Roadmap */}
          <div className="bg-[#080808] border border-white/[0.08] rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-white/[0.06] text-neutral-300 flex items-center justify-center text-[10px] font-mono">03</span>
              Step-by-Step DIY Execution Blueprint
            </h3>

            <div className="space-y-2.5">
              {result.diy_execution_blueprint.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#030303] border border-white/[0.06]">
                  <div className="w-6 h-6 rounded-md bg-white/[0.06] text-neutral-300 flex items-center justify-center font-mono text-xs shrink-0">
                    {step.step}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-semibold text-white">{step.action}</h5>
                      <span className="text-[10px] font-mono text-neutral-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.06]">
                        {step.recommended_tool}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{step.instruction}</p>
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
