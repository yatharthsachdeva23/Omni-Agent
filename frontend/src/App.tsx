import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Track1Advisor } from './components/Track1Advisor';
import { Track2Execution } from './components/Track2Execution';
import { ToolCatalogModal } from './components/ToolCatalogModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'advisor' | 'execution'>('execution');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCatalog={() => setIsCatalogOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 pt-6">
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 font-mono">
        Omni Agent Ecosystem &bull; Powered by Jev System 1 Routing &bull; Python 3.12 Orchestration Core
      </footer>
    </div>
  );
};

export default App;
