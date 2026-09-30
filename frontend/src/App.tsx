import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Track1Advisor } from './components/Track1Advisor';
import { Track2Execution } from './components/Track2Execution';
import { ToolCatalogModal } from './components/ToolCatalogModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'advisor' | 'execution'>('execution');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-[#ededed] flex flex-col font-['Inter',sans-serif] relative overflow-hidden">
      {/* Resend Top Ambient Lighting & Grid */}
      <div className="absolute top-0 left-0 right-0 h-96 resend-radial-glow pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px resend-top-line pointer-events-none"></div>

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCatalog={() => setIsCatalogOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 relative z-10">
        {activeTab === 'advisor' ? (
          <Track1Advisor />
        ) : (
          <Track2Execution />
        )}
      </main>

      {/* AI Tool Directory Modal */}
      <ToolCatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
      />

      {/* Minimal Resend-style Footer */}
      <footer className="border-t border-white/[0.08] py-8 text-center text-xs text-neutral-500 font-mono relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Omni Agent Ecosystem &bull; Python 3.12 Engine</span>
          </div>
          <p className="text-neutral-600 text-[11px]">
            Jev System 1 Routing &bull; Common Context Blackboard &bull; Gemini Multimodal QA
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
