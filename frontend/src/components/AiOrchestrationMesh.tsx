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
      name: 'Jev (TypeSafe)',
      role: 'System 1 Heuristic Router',
      render: (
        <div className="flex items-center gap-3.5">
          {/* Official TypeSafe AI Vector Shield */}
          <svg viewBox="0 0 103 144" className="w-8 sm:w-9 h-11 sm:h-12 fill-white shrink-0">
            <path
              fill="#FFFFFF"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M49.119.607a4.56 4.56 0 0 1 4.558.006l.005-.006L77.11 14.128a4.57 4.57 0 0 1 2.28 3.954v24.252l20.835 12.043a4.56 4.56 0 0 1 2.29 3.955v54.072a4.56 4.56 0 0 1-2.284 3.954l-.006-.006c-.044.026-.08.052-.11.066l-.027.011-46.702 26.959a4.6 4.6 0 0 1-4.031.269l-.544-.269-23.34-13.531-.038-.022a4.58 4.58 0 0 1-2.28-3.96v-24.224L2.46 89.684h-.01l-.176-.104a4.6 4.6 0 0 1-1.34-1.186l-.006-.006a4.6 4.6 0 0 1-.642-1.203l.005-.005A4.5 4.5 0 0 1 0 85.63V31.565c0-1.633.88-3.145 2.29-3.96zm-12.28 125.279 14.262 8.265 37.707-21.758-14.274-8.249zM55.972 61.27v24.4a4.56 4.56 0 0 1-2.724 4.157l-20.962 12.148v15.992l37.685-21.731V53.164zm23.143 34.977 14.267 8.238V60.968l-14.267-8.244zm-65.407-10.61 13.883 8.029 14.25-8.249-13.85-7.996zM9.143 34.195v43.539l14.295-8.227V45.085c0-1.635.865-3.142 2.285-3.96l21.11-12.169V12.464zm23.428 35.323 13.982 8.051V61.11l-13.982-8.078zm4.563-24.427 13.873 8.029 14.278-8.243-13.883-8.007zm18.837-16.13 14.29 8.222V20.718l-14.29-8.248z"
            />
          </svg>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">Jev</span>
            <span className="text-[10px] font-mono tracking-widest text-neutral-300 uppercase font-bold">TypeSafe</span>
          </div>
        </div>
      ),
    },
    {
      name: 'OpenAI',
      role: 'GPT-4o Reasoning & Verification',
      render: (
        <div className="flex items-center gap-3.5">
          {/* Official OpenAI Rosette */}
          <svg viewBox="0 0 24 24" className="w-9 sm:w-10 h-9 sm:h-10 fill-white shrink-0">
            <path
              fill="#FFFFFF"
              d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5985 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"
            />
          </svg>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">OpenAI</span>
        </div>
      ),
    },
    {
      name: 'Google Gemini',
      role: 'Multimodal Vision QA',
      render: (
        <div className="flex items-center gap-3.5">
          {/* Official Gemini Sparkle */}
          <svg viewBox="0 0 24 24" className="w-9 sm:w-10 h-9 sm:h-10 fill-white shrink-0">
            <path
              fill="#FFFFFF"
              d="M11.5 0C11.5 6.35 6.35 11.5 0 11.5C6.35 11.5 11.5 16.65 11.5 23C11.5 16.65 16.65 11.5 23 11.5C16.65 11.5 11.5 6.35 11.5 0Z"
            />
          </svg>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">Gemini</span>
        </div>
      ),
    },
    {
      name: 'Anthropic',
      role: 'Claude 3.5 Planning',
      render: (
        <div className="flex items-center gap-3.5">
          {/* Official Anthropic Vector */}
          <svg viewBox="0 0 24 24" className="w-9 sm:w-10 h-9 sm:h-10 fill-white shrink-0">
            <path
              fill="#FFFFFF"
              fillRule="evenodd"
              d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z"
            />
          </svg>
          <span className="text-xl sm:text-2xl font-bold tracking-wider text-white font-sans">ANTHROPIC</span>
        </div>
      ),
    },
    {
      name: 'Mistral AI',
      role: 'Formal Logic & Code Verification',
      render: (
        <div className="flex items-center gap-3.5">
          {/* Official Mistral AI Pixel M */}
          <svg viewBox="0 0 24 24" className="w-9 sm:w-10 h-9 sm:h-10 fill-white shrink-0">
            <path
              fill="#FFFFFF"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.428 3.4h3.429v3.428h3.429v3.429h-.002 3.431V6.828h3.427V3.4h3.43v13.714H24v3.429H13.714v-3.428h-3.428v-3.429h-3.43v3.428h3.43v3.429H0v-3.429h3.428V3.4zm10.286 13.715h3.428v-3.429h-3.427v3.429z"
            />
          </svg>
          <div className="flex flex-col text-left leading-none font-mono font-black text-white">
            <span className="text-sm sm:text-base tracking-widest font-black">MISTRAL</span>
            <span className="text-sm sm:text-base tracking-widest font-black">AI_</span>
          </div>
        </div>
      ),
    },
    {
      name: 'Groq',
      role: 'LPU Ultra-Low Latency Inference',
      render: (
        <div className="flex items-center gap-3.5">
          {/* Official Groq Hooked 'g' Vector */}
          <svg viewBox="0 0 24 24" className="w-9 sm:w-10 h-9 sm:h-10 fill-white shrink-0">
            <path
              fill="#FFFFFF"
              fillRule="evenodd"
              d="M12.036 2c-3.853-.035-7 3-7.036 6.781-.035 3.782 3.055 6.872 6.908 6.907h2.42v-2.566h-2.292c-2.407.028-4.38-1.866-4.408-4.23-.029-2.362 1.901-4.298 4.308-4.326h.1c2.407 0 4.358 1.915 4.365 4.278v6.305c0 2.342-1.944 4.25-4.323 4.279a4.375 4.375 0 01-3.033-1.252l-1.851 1.818A7 7 0 0012.029 22h.092c3.803-.056 6.858-3.083 6.879-6.816v-6.5C18.907 4.963 15.817 2 12.036 2z"
            />
          </svg>
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans lowercase">groq</span>
        </div>
      ),
    },
    {
      name: 'Qwen',
      role: 'Qwen 2.5 Coder Swarm Core',
      render: (
        <div className="flex items-center gap-3.5">
          {/* Official Qwen Geometric Cluster Vector */}
          <svg viewBox="0 0 24 24" className="w-9 sm:w-10 h-9 sm:h-10 fill-white shrink-0">
            <path
              fill="#FFFFFF"
              fillRule="evenodd"
              d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z"
            />
          </svg>
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">Qwen</span>
        </div>
      ),
    },
    {
      name: 'FLUX.1',
      role: 'Visual Synthesis & Generation',
      render: (
        <div className="flex items-center gap-3.5">
          {/* Official Black Forest Labs / FLUX Vector Delta */}
          <svg viewBox="0 0 24 24" className="w-9 sm:w-10 h-9 sm:h-10 fill-white shrink-0">
            <path
              fill="#FFFFFF"
              fillRule="evenodd"
              d="M0 20.683L12.01 2.5 24 20.683h-2.233L12.009 5.878 3.471 18.806h12.122l1.239 1.877H0z"
            />
            <path
              fill="#FFFFFF"
              fillRule="evenodd"
              d="M8.069 16.724l2.073-3.115 2.074 3.115H8.069zM18.24 20.683l-5.668-8.707h2.177l5.686 8.707h-2.196zM19.74 11.676l2.13-3.19 2.13 3.19h-4.26z"
            />
          </svg>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-sans">FLUX.1</span>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-9 select-none">
      {/* Resend-Style Centered Headline */}
      <div className="text-center space-y-2 max-w-3xl mx-auto px-4">
        <p className="text-sm sm:text-base font-normal text-neutral-300 tracking-tight leading-relaxed">
          Autonomous intelligence orchestrated across leading foundational models and System 1 decision engines.
        </p>
      </div>

      {/* Big Solid White Logos (Resend Grid Layout) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-10 items-center justify-items-center max-w-6xl mx-auto px-4 py-3">
        {models.map((item, idx) => (
          <div
            key={idx}
            title={`${item.name} • ${item.role}`}
            className="flex items-center justify-center p-3 text-white transition-transform duration-200 hover:scale-105 cursor-default filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.08)]"
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
