import React from 'react';
import { ArrowRight, Cpu, Layers } from 'lucide-react';

interface AiOrchestrationMeshProps {
  onExploreArchitecture?: () => void;
}

export const AiOrchestrationMesh: React.FC<AiOrchestrationMeshProps> = ({
  onExploreArchitecture,
}) => {
  const models = [
    {
      name: 'Jev',
      tagline: 'System 1 Fast Router',
      category: 'TypeSafe AI • 70-500ms DAG Routing',
      svg: (
        <svg viewBox="0 0 120 32" className="h-6 w-auto fill-current" aria-label="Jev">
          <g>
            {/* Jev precision diamond mark */}
            <path d="M12 2 L22 16 L12 30 L2 16 Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M12 7 L18 16 L12 25 L6 16 Z" fill="currentColor" opacity="0.3" />
            <circle cx="12" cy="16" r="2.5" fill="currentColor" />
            {/* Wordmark: jev */}
            <text x="32" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontSize="19" fontWeight="700" letterSpacing="-0.5px">
              jev
            </text>
          </g>
        </svg>
      ),
    },
    {
      name: 'OpenAI',
      tagline: 'GPT-4o & GPT-OSS-120B',
      category: 'Auditing & Deep Reasoning',
      svg: (
        <svg viewBox="0 0 135 32" className="h-6 w-auto fill-current" aria-label="OpenAI">
          <g>
            {/* OpenAI spiral emblem */}
            <path
              d="M14.5 4.5 C17.8 2.6 21.9 2.9 24.8 5.3 C27.8 7.7 28.9 11.7 27.6 15.3 L27.2 16.3 L24.3 14.6 L24.7 13.6 C25.5 11.2 24.7 8.5 22.7 6.9 C20.6 5.2 17.7 5.0 15.5 6.3 L11.2 8.8 L11.2 5.5 L14.5 4.5 Z"
              fill="currentColor"
            />
            <path
              d="M27.5 13.5 C29.4 16.8 29.1 20.9 26.7 23.8 C24.3 26.8 20.3 27.9 16.7 26.6 L15.7 26.2 L17.4 23.3 L18.4 23.7 C20.8 24.5 23.5 23.7 25.1 21.7 C26.8 19.6 27.0 16.7 25.7 14.5 L23.2 10.2 L26.5 10.2 L27.5 13.5 Z"
              fill="currentColor"
            />
            <path
              d="M13 27.5 C9.7 29.4 5.6 29.1 2.7 26.7 C-0.3 24.3 -1.4 20.3 -0.1 16.7 L0.3 15.7 L3.2 17.4 L2.8 18.4 C2.0 20.8 2.8 23.5 4.8 25.1 C6.9 26.8 9.8 27.0 12.0 25.7 L16.3 23.2 L16.3 26.5 L13 27.5 Z"
              fill="currentColor"
            />
            <path
              d="M2.5 18.5 C0.6 15.2 0.9 11.1 3.3 8.2 C5.7 5.2 9.7 4.1 13.3 5.4 L14.3 5.8 L12.6 8.7 L11.6 8.3 C9.2 7.5 6.5 8.3 4.9 10.3 C3.2 12.4 3.0 15.3 4.3 17.5 L6.8 21.8 L3.5 21.8 L2.5 18.5 Z"
              fill="currentColor"
            />
            <circle cx="14" cy="16" r="3" fill="currentColor" />
            {/* Wordmark */}
            <text x="35" y="21.5" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="600" letterSpacing="-0.3px">
              OpenAI
            </text>
          </g>
        </svg>
      ),
    },
    {
      name: 'Google Gemini',
      tagline: 'Gemini 3.5 Flash',
      category: 'Multimodal Vision QA Gate',
      svg: (
        <svg viewBox="0 0 140 32" className="h-6 w-auto fill-current" aria-label="Google Gemini">
          <g>
            {/* Gemini sparkle icon */}
            <path
              d="M14 2 C14 8.6 8.6 14 2 14 C8.6 14 14 19.4 14 26 C14 19.4 19.4 14 26 14 C19.4 14 14 8.6 14 2 Z"
              fill="currentColor"
            />
            {/* Wordmark */}
            <text x="33" y="21" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="600" letterSpacing="-0.2px">
              Gemini
            </text>
          </g>
        </svg>
      ),
    },
    {
      name: 'Mistral AI',
      tagline: 'Mistral Large & Small',
      category: 'Legal & Logic Specialist',
      svg: (
        <svg viewBox="0 0 150 32" className="h-6 w-auto fill-current" aria-label="Mistral AI">
          <g>
            {/* Mistral geometric pixel M (identical to Resend screenshot) */}
            <rect x="2" y="6" width="4" height="20" fill="currentColor" />
            <rect x="6" y="10" width="4" height="4" fill="currentColor" />
            <rect x="10" y="14" width="4" height="4" fill="currentColor" />
            <rect x="14" y="10" width="4" height="4" fill="currentColor" />
            <rect x="18" y="6" width="4" height="20" fill="currentColor" />
            {/* Wordmark matching Mistral official styling */}
            <text x="28" y="15" fontFamily="'Courier New', monospace, sans-serif" fontSize="11" fontWeight="800" letterSpacing="1px">
              MISTRAL
            </text>
            <text x="28" y="25" fontFamily="'Courier New', monospace, sans-serif" fontSize="11" fontWeight="800" letterSpacing="1px">
              AI_
            </text>
          </g>
        </svg>
      ),
    },
    {
      name: 'Anthropic',
      tagline: 'Claude 3.5 Sonnet',
      category: 'Deep Multi-Step Reasoning',
      svg: (
        <svg viewBox="0 0 155 32" className="h-6 w-auto fill-current" aria-label="Anthropic">
          <g>
            {/* Anthropic stylized A mark */}
            <path
              d="M11 5 L4 25 L8.5 25 L10 20 L16 20 L17.5 25 L22 25 L15 5 Z M11.5 15.5 L13 10.5 L14.5 15.5 Z"
              fill="currentColor"
            />
            {/* Wordmark */}
            <text x="28" y="21" fontFamily="system-ui, -apple-system, sans-serif" fontSize="14" fontWeight="700" letterSpacing="1.2px">
              ANTHROPIC
            </text>
          </g>
        </svg>
      ),
    },
    {
      name: 'Groq',
      tagline: 'LPU Inference Core',
      category: 'Ultra-Low Latency Execution',
      svg: (
        <svg viewBox="0 0 110 32" className="h-6 w-auto fill-current" aria-label="Groq">
          <g>
            {/* Groq circle with diagonal bar */}
            <circle cx="12" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="2.8" />
            <path d="M7 21 L17 11" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            {/* Wordmark */}
            <text x="28" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontSize="19" fontWeight="700" letterSpacing="-0.5px">
              groq
            </text>
          </g>
        </svg>
      ),
    },
    {
      name: 'Qwen',
      tagline: 'Qwen 2.5 Coder',
      category: 'Polyglot Software Engineering',
      svg: (
        <svg viewBox="0 0 130 32" className="h-6 w-auto fill-current" aria-label="Qwen">
          <g>
            {/* Hexagonal node cluster */}
            <path d="M12 4 L21 9 L21 21 L12 26 L3 21 L3 9 Z" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <circle cx="12" cy="15" r="3.5" fill="currentColor" />
            <line x1="12" y1="4" x2="12" y2="11.5" stroke="currentColor" strokeWidth="1.8" />
            <line x1="21" y1="21" x2="15" y2="17.5" stroke="currentColor" strokeWidth="1.8" />
            <line x1="3" y1="21" x2="9" y2="17.5" stroke="currentColor" strokeWidth="1.8" />
            {/* Wordmark */}
            <text x="28" y="21.5" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="700" letterSpacing="-0.2px">
              Qwen 2.5
            </text>
          </g>
        </svg>
      ),
    },
    {
      name: 'Flux.1',
      tagline: 'Black Forest Labs',
      category: 'Photorealistic Visual Synthesis',
      svg: (
        <svg viewBox="0 0 135 32" className="h-6 w-auto fill-current" aria-label="Flux.1">
          <g>
            {/* Flux geometric isometric prism */}
            <path d="M12 3 L22 9 L12 15 L2 9 Z" fill="currentColor" opacity="0.9" />
            <path d="M2 11 L12 17 L12 28 L2 22 Z" fill="currentColor" opacity="0.6" />
            <path d="M12 17 L22 11 L22 22 L12 28 Z" fill="currentColor" opacity="0.4" />
            {/* Wordmark */}
            <text x="28" y="22" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="800" letterSpacing="0.5px">
              FLUX.1
            </text>
          </g>
        </svg>
      ),
    },
    {
      name: 'DeepSeek',
      tagline: 'DeepSeek V3 / R1',
      category: 'Advanced Math & Derivations',
      svg: (
        <svg viewBox="0 0 145 32" className="h-6 w-auto fill-current" aria-label="DeepSeek">
          <g>
            {/* DeepSeek wave fin */}
            <path
              d="M3 19 C7 11 15 8 23 11 C20 16 14 18 10 23 C6 25 4 23 3 19 Z"
              fill="currentColor"
            />
            <circle cx="16" cy="14" r="2" fill="currentColor" />
            {/* Wordmark */}
            <text x="29" y="21.5" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="700" letterSpacing="-0.3px">
              DeepSeek
            </text>
          </g>
        </svg>
      ),
    },
    {
      name: 'Meta Llama',
      tagline: 'Llama 3.3 70B',
      category: 'Open Foundational Core',
      svg: (
        <svg viewBox="0 0 150 32" className="h-6 w-auto fill-current" aria-label="Meta Llama">
          <g>
            {/* Meta infinity ribbon */}
            <path
              d="M7 21 C4 18 4 14 7 11 C10 8 13 11 16 16 C19 21 22 24 25 21 C28 18 28 14 25 11 C22 8 19 11 16 16 C13 21 10 24 7 21 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            />
            {/* Wordmark */}
            <text x="32" y="21.5" fontFamily="system-ui, -apple-system, sans-serif" fontSize="15" fontWeight="600" letterSpacing="-0.2px">
              Meta Llama
            </text>
          </g>
        </svg>
      ),
    },
    {
      name: 'OpenRouter',
      tagline: 'Model Mesh Network',
      category: 'Redundant High-Availability Mesh',
      svg: (
        <svg viewBox="0 0 160 32" className="h-6 w-auto fill-current" aria-label="OpenRouter">
          <g>
            {/* OpenRouter routing chevron loop */}
            <path d="M4 16 L12 8 L20 16 L12 24 Z" fill="none" stroke="currentColor" strokeWidth="2.2" />
            <path d="M12 12 L16 16 L12 20 L8 16 Z" fill="currentColor" />
            {/* Wordmark */}
            <text x="27" y="21" fontFamily="system-ui, -apple-system, sans-serif" fontSize="15" fontWeight="600" letterSpacing="-0.3px">
              OpenRouter
            </text>
          </g>
        </svg>
      ),
    },
    {
      name: 'TypeSafe AI',
      tagline: 'Jev Core Architecture',
      category: 'Deterministic System 1 Routing',
      svg: (
        <svg viewBox="0 0 150 32" className="h-6 w-auto fill-current" aria-label="TypeSafe AI">
          <g>
            {/* TypeSafe terminal prompt mark */}
            <rect x="2" y="5" width="22" height="22" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M7 12 L11 16 L7 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="13" y1="20" x2="18" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            {/* Wordmark */}
            <text x="30" y="21" fontFamily="system-ui, -apple-system, sans-serif" fontSize="15" fontWeight="600" letterSpacing="-0.2px">
              TypeSafe AI
            </text>
          </g>
        </svg>
      ),
    },
  ];

  return (
    <section className="relative w-full border-t border-white/[0.08] bg-black py-20 px-4 sm:px-6 overflow-hidden">
      {/* Subtle Ambient Radial Lighting (matching Resend aesthetic) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-44 bg-white/[0.02] blur-3xl pointer-events-none rounded-full"></div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-12">
        {/* Editorial Heading (matching Resend screenshot) */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <p className="text-sm sm:text-base font-normal text-neutral-400 tracking-tight leading-relaxed">
            Autonomous multi-agent swarms orchestrated across the world&rsquo;s most capable AI engines.
          </p>
        </div>

        {/* Logo Grid: 2 rows of 6 logos on desktop, 3 or 4 on tablet, 2 on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-10 items-center justify-items-center">
          {models.map((item, idx) => (
            <div
              key={idx}
              title={`${item.name} • ${item.tagline} (${item.category})`}
              className="group flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 cursor-default opacity-60 hover:opacity-100 hover:scale-[1.04]"
            >
              <div className="text-neutral-300 group-hover:text-white transition-colors duration-200">
                {item.svg}
              </div>
              <span className="text-[10px] font-mono text-neutral-500 group-hover:text-neutral-400 transition-colors mt-2 text-center whitespace-nowrap opacity-0 group-hover:opacity-100 duration-200">
                {item.tagline}
              </span>
            </div>
          ))}
        </div>

        {/* Resend-style Link at the bottom ("Explore Architecture >") */}
        {onExploreArchitecture && (
          <div className="flex justify-center pt-2">
            <button
              onClick={onExploreArchitecture}
              className="group inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors duration-200 font-medium"
            >
              <span>Explore Multi-Agent Architecture</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AiOrchestrationMesh;
