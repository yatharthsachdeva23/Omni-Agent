import React, { useState, useEffect } from 'react';
import { X, Search, Sparkles } from 'lucide-react';

interface Tool {
  id: string;
  name: string;
  provider: string;
  category: string;
  description: string;
  strengths: string[];
  is_free: boolean;
  pricing_tier: string;
}

interface ToolCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ToolCatalogModal: React.FC<ToolCatalogModalProps> = ({ isOpen, onClose }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/catalog')
        .then(res => res.json())
        .then(data => setTools(data.catalog || []))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = ['all', ...Array.from(new Set(tools.map(t => t.category)))];

  const filteredTools = tools.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                          t.description.toLowerCase().includes(search.toLowerCase()) ||
                          t.provider.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#080808] border border-white/[0.1] rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">OmniTask AI Matrix</h3>
              <p className="text-[11px] text-neutral-400">Directory of onboarded models & specialized agents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-white/[0.06] bg-[#040404] flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models, providers..."
              className="w-full bg-[#080808] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setCategoryFilter(cat)}
                className={`text-[11px] px-2.5 py-1 rounded-md capitalize font-medium whitespace-nowrap transition-all ${
                  categoryFilter === cat
                    ? 'bg-white text-black font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="p-4 rounded-xl bg-[#030303] border border-white/[0.06] hover:border-white/[0.15] space-y-2 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                    {tool.category}
                  </span>
                  <h4 className="text-xs font-semibold text-white mt-0.5">{tool.name}</h4>
                  <p className="text-[11px] text-neutral-500">{tool.provider}</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-neutral-300">
                  {tool.pricing_tier}
                </span>
              </div>

              <p className="text-xs text-neutral-400 leading-relaxed">
                {tool.description}
              </p>

              <div className="flex flex-wrap gap-1 pt-1">
                {tool.strengths.map((str, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/[0.03] text-neutral-400 font-mono"
                  >
                    {str}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
