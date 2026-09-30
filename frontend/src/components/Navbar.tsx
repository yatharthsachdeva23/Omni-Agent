import React from 'react';
import { Layers, Compass, Zap, Database, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'advisor' | 'execution';
  setActiveTab: (tab: 'advisor' | 'execution') => void;
  onOpenCatalog: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCatalog,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#080d1a]/85 border-b border-slate-800/80 px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Layers className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                OMNI AGENT
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0 Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Jev System 1 Router &bull; Python 3.12 Core
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('advisor')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'advisor'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Track 1: Free Advisor</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
              activeTab === 'advisor' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
            }`}>
              DIY
            </span>
          </button>

          <button
            onClick={() => setActiveTab('execution')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'execution'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Track 2: Omni Autonomous</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
              activeTab === 'execution' ? 'bg-slate-950/20 text-slate-950' : 'bg-cyan-500/20 text-cyan-300'
            }`}>
              Full Auto
            </span>
          </button>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCatalog}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all hover:border-slate-600"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Tool Matrix</span>
          </button>
        </div>
      </div>
    </header>
  );
};
