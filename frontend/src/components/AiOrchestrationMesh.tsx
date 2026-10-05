import React from 'react';
import { ArrowRight } from 'lucide-react';

interface AiOrchestrationMeshProps {
  onExploreArchitecture?: () => void;
}

export const AiOrchestrationMesh: React.FC<AiOrchestrationMeshProps> = ({
  onExploreArchitecture,
}) => {
  const models = [
    {
      name: 'Jev',
      role: 'System 1 Router',
      render: (
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-8 h-8 shrink-0">
            <path d="M12 1 L23 12 L12 23 L1 12 Z" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M12 6 L18 12 L12 18 L6 12 Z" fill="#FFFFFF" opacity="0.4" />
            <circle cx="12" cy="12" r="2.8" fill="#FFFFFF" />
          </svg>
          <div className="flex items-baseline gap-1.5 text-left">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-white font-sans">jev</span>
            <span className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase font-semibold">by TypeSafe</span>
          </div>
        </div>
      ),
    },
    {
      name: 'OpenAI',
      role: 'GPT-4o Reasoning & Audit',
      render: (
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white shrink-0">
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5985 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
          </svg>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">OpenAI</span>
        </div>
      ),
    },
    {
      name: 'Google Gemini',
      role: 'Multimodal Vision QA',
      render: (
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white shrink-0">
            <path d="M11.5 0C11.5 6.35 6.35 11.5 0 11.5C6.35 11.5 11.5 16.65 11.5 23C11.5 16.65 16.65 11.5 23 11.5C16.65 11.5 11.5 6.35 11.5 0Z" />
          </svg>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">Gemini</span>
        </div>
      ),
    },
    {
      name: 'Anthropic',
      role: 'Claude 3.5 Planning',
      render: (
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white shrink-0">
            <path d="m13.824 3.734 6.787 16.532h-3.432l-1.393-3.45H8.214l-1.393 3.45H3.389L10.176 3.734zm-1.824 10.027-2.2-5.45-2.2 5.45z" />
          </svg>
          <span className="text-xl sm:text-2xl font-bold tracking-wider text-white font-sans">ANTHROPIC</span>
        </div>
      ),
    },
    {
      name: 'Mistral AI',
      role: 'Formal Logic & Legal',
      render: (
        <div className="flex items-center gap-3">
          {/* Mistral official 5-step pixel grid M matching Resend screenshot */}
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white shrink-0">
            <rect x="1" y="2" width="4.4" height="20" />
            <rect x="5.4" y="6" width="4.4" height="5" />
            <rect x="9.8" y="11" width="4.4" height="5" />
            <rect x="14.2" y="6" width="4.4" height="5" />
            <rect x="18.6" y="2" width="4.4" height="20" />
          </svg>
          <div className="flex flex-col text-left leading-none font-mono font-black text-white">
            <span className="text-sm tracking-widest font-black">MISTRAL</span>
            <span className="text-sm tracking-widest font-black">AI_</span>
          </div>
        </div>
      ),
    },
    {
      name: 'Groq',
      role: 'LPU Inference Core',
      render: (
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white shrink-0">
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c4.639 0 8.4 3.761 8.4 8.4 0 1.942-.66 3.731-1.768 5.155L6.845 5.368A8.347 8.347 0 0 1 12 3.6zm-6.632 3.245l11.787 11.787A8.347 8.347 0 0 1 12 20.4c-4.639 0-8.4-3.761-8.4-8.4 0-1.942.66-3.731 1.768-5.155z" />
          </svg>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans lowercase">groq</span>
        </div>
      ),
    },
    {
      name: 'Qwen',
      role: 'Qwen 2.5 Coder',
      render: (
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-white stroke-[2.2] shrink-0">
            <path strokeLinejoin="round" d="M12 2 L21 7.2 L21 16.8 L12 22 L3 16.8 L3 7.2 Z" />
            <circle cx="12" cy="12" r="3.2" fill="white" stroke="none" />
            <line x1="12" y1="2" x2="12" y2="8.8" strokeLinecap="round" />
            <line x1="21" y1="16.8" x2="15.2" y2="13.6" strokeLinecap="round" />
            <line x1="3" y1="16.8" x2="8.8" y2="13.6" strokeLinecap="round" />
          </svg>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white font-sans">Qwen 2.5</span>
        </div>
      ),
    },
    {
      name: 'FLUX.1',
      role: 'Visual Synthesis',
      render: (
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white shrink-0">
            <path d="M12 2 L22 7.8 L12 13.5 L2 7.8 Z" />
            <path d="M2 9.8 L12 15.5 L12 23 L2 17.2 Z" opacity="0.85" />
            <path d="M12 15.5 L22 9.8 L22 17.2 L12 23 Z" opacity="0.7" />
          </svg>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">FLUX.1</span>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-8 select-none">
      {/* Resend-Style Centered Headline */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <p className="text-sm sm:text-base font-normal text-neutral-300 tracking-tight leading-relaxed">
          Autonomous intelligence orchestrated across leading foundational models and System 1 decision engines.
        </p>
      </div>

      {/* Big Solid White Logos (Resend Grid Layout) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-10 gap-y-8 items-center justify-items-center max-w-5xl mx-auto px-4 py-2">
        {models.map((item, idx) => (
          <div
            key={idx}
            title={`${item.name} • ${item.role}`}
            className="flex items-center justify-center p-3 text-white transition-transform duration-200 hover:scale-105 cursor-default"
          >
            {item.render}
          </div>
        ))}
      </div>

      {/* Resend-style Link at the bottom */}
      {onExploreArchitecture && (
        <div className="flex justify-center pt-2">
          <button
            onClick={onExploreArchitecture}
            className="group inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors duration-200 font-medium"
          >
            <span>Explore Orchestration Architecture</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-white" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AiOrchestrationMesh;
