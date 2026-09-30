import React from 'react';
import { Compass, Zap, Database } from 'lucide-react';

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
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/80 border-b border-white/[0.08] transition-all">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-black font-black text-xs tracking-tighter">
              OA
            </div>
            <span className="font-semibold text-sm tracking-tight text-white">
              Omni Agent
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/[0.1] text-[11px] font-mono text-neutral-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Jev Router &bull; Python 3.12</span>
          </div>
        </div>

        {/* Navigation Tabs (Resend-style minimal pill) */}
        <div className="flex items-center p-1 bg-white/[0.04] border border-white/[0.08] rounded-full">
          <button
            onClick={() => setActiveTab('advisor')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'advisor'
                ? 'bg-white text-black shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Track 1: Free Advisor</span>
          </button>

          <button
            onClick={() => setActiveTab('execution')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'execution'
                ? 'bg-white text-black shadow-sm font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Track 2: Autonomous Hub</span>
          </button>
        </div>

        {/* Action */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCatalog}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium bg-transparent hover:bg-white/[0.05] text-neutral-300 hover:text-white border border-white/[0.1] hover:border-white/[0.2] transition-all"
          >
            <Database className="w-3.5 h-3.5 text-neutral-400" />
            <span>AI Matrix</span>
          </button>
        </div>
      </div>
    </header>
  );
};
